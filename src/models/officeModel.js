const { getDb } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

async function getAllOffices(includeUnpublished = false) {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const sql = includeUnpublished
      ? 'SELECT * FROM offices ORDER BY created_at DESC'
      : 'SELECT * FROM offices WHERE published = 1 ORDER BY created_at DESC';
    db.all(sql, [], (err, rows) => {
      if (err) return reject(err);
      resolve(rows.map(parseOffice));
    });
  });
}

async function getOfficeById(id) {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM offices WHERE id = ?', [id], (err, row) => {
      if (err) return reject(err);
      resolve(row ? parseOffice(row) : null);
    });
  });
}

async function createOffice(data) {
  const db = await getDb();
  const id = uuidv4();
  const now = new Date().toISOString();
  const photos = JSON.stringify(data.photos || []);
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO offices (id, name, location, description, contact_email, contact_phone, contact_address, photos, published, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        data.name,
        data.location || null,
        data.description || null,
        data.contact_email || null,
        data.contact_phone || null,
        data.contact_address || null,
        photos,
        data.published !== undefined ? (data.published ? 1 : 0) : 1,
        now,
        now,
      ],
      function (err) {
        if (err) return reject(err);
        resolve({ id, ...data, photos: data.photos || [], created_at: now, updated_at: now });
      }
    );
  });
}

async function updateOffice(id, data) {
  const db = await getDb();
  const now = new Date().toISOString();
  return new Promise((resolve, reject) => {
    const fields = [];
    const values = [];

    if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name); }
    if (data.location !== undefined) { fields.push('location = ?'); values.push(data.location); }
    if (data.description !== undefined) { fields.push('description = ?'); values.push(data.description); }
    if (data.contact_email !== undefined) { fields.push('contact_email = ?'); values.push(data.contact_email); }
    if (data.contact_phone !== undefined) { fields.push('contact_phone = ?'); values.push(data.contact_phone); }
    if (data.contact_address !== undefined) { fields.push('contact_address = ?'); values.push(data.contact_address); }
    if (data.photos !== undefined) { fields.push('photos = ?'); values.push(JSON.stringify(data.photos)); }
    if (data.published !== undefined) { fields.push('published = ?'); values.push(data.published ? 1 : 0); }

    fields.push('updated_at = ?');
    values.push(now);
    values.push(id);

    if (fields.length === 1) return resolve(null); // only updated_at, nothing to update

    db.run(`UPDATE offices SET ${fields.join(', ')} WHERE id = ?`, values, function (err) {
      if (err) return reject(err);
      resolve({ changes: this.changes });
    });
  });
}

async function deleteOffice(id) {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    db.run('DELETE FROM offices WHERE id = ?', [id], function (err) {
      if (err) return reject(err);
      resolve({ changes: this.changes });
    });
  });
}

function parseOffice(row) {
  let photos = [];
  try {
    photos = JSON.parse(row.photos || '[]');
  } catch (e) {
    photos = [];
  }
  return { ...row, photos, published: row.published === 1 };
}

module.exports = {
  getAllOffices,
  getOfficeById,
  createOffice,
  updateOffice,
  deleteOffice,
};
