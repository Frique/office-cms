const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../config/database');

const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

async function initializeDatabase() {
  const db = await getDb();

  // Read and execute schema
  const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');
  const statements = schema
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);

  for (const statement of statements) {
    await new Promise((resolve, reject) => {
      db.run(statement, err => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  // Create default admin if none exists
  await createDefaultAdmin(db);

  console.log('Database initialized successfully');
}

async function createDefaultAdmin(db) {
  return new Promise((resolve, reject) => {
    db.get('SELECT id FROM admins LIMIT 1', async (err, row) => {
      if (err) return reject(err);
      if (row) return resolve(); // admin already exists

      const email = process.env.ADMIN_EMAIL || 'admin@offices.local';
      const password = process.env.ADMIN_PASSWORD || 'changeme123';
      const hash = await bcrypt.hash(password, 10);
      const id = uuidv4();
      const now = new Date().toISOString();

      db.run(
        'INSERT INTO admins (id, email, password_hash, created_at) VALUES (?, ?, ?, ?)',
        [id, email, hash, now],
        err => {
          if (err) return reject(err);
          console.log(`Default admin created: ${email}`);
          resolve();
        }
      );
    });
  });
}

module.exports = { initializeDatabase };
