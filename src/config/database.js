const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

let db = null;

function getDb() {
  if (db) return Promise.resolve(db);

  return new Promise((resolve, reject) => {
    const dbPath = process.env.DATABASE_PATH || './data/offices.db';
    const dbDir = path.dirname(path.resolve(dbPath));

    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    db = new sqlite3.Database(dbPath, err => {
      if (err) {
        console.error('Failed to open database:', err);
        reject(err);
      } else {
        // Enable WAL mode for better concurrency
        db.run('PRAGMA journal_mode=WAL');
        db.run('PRAGMA foreign_keys=ON');
        resolve(db);
      }
    });
  });
}

module.exports = { getDb };
