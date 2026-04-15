const bcrypt = require('bcryptjs');
const { getDb } = require('../config/database');

async function login(req, res) {
  try {
    const { email, password } = req.body;
    const db = await getDb();

    const admin = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM admins WHERE email = ?', [email.trim().toLowerCase()], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!admin) {
      // Perform dummy comparison to prevent timing attacks
      await bcrypt.compare(password, '$2a$10$dummyhashfordummycompare12345678');
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, admin.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    req.session.adminId = admin.id;
    req.session.adminEmail = admin.email;

    res.json({ success: true, redirect: '/admin' });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
}

async function logout(req, res) {
  req.session.destroy(err => {
    if (err) console.error('Session destroy error:', err);
    res.clearCookie('connect.sid');
    res.json({ success: true });
  });
}

function checkSession(req, res) {
  if (req.session && req.session.adminId) {
    return res.json({ authenticated: true, email: req.session.adminEmail });
  }
  res.json({ authenticated: false });
}

module.exports = { login, logout, checkSession };
