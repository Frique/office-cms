# Database Documentation

## Overview

Office CMS uses SQLite3 for data storage. The database file is auto-created at `data/offices.db` on first startup.

## Tables

### `offices`

Stores office location information.

| Column | Type | Description |
|--------|------|-------------|
| `id` | TEXT (UUID) | Primary key |
| `name` | TEXT | Office name (required) |
| `location` | TEXT | City/country |
| `description` | TEXT | Detailed description |
| `contact_email` | TEXT | Contact email |
| `contact_phone` | TEXT | Contact phone |
| `contact_address` | TEXT | Physical address |
| `photos` | TEXT (JSON) | JSON array of photo URLs |
| `published` | INTEGER | 1=published, 0=draft |
| `created_at` | TEXT | ISO 8601 timestamp |
| `updated_at` | TEXT | ISO 8601 timestamp |

### `admins`

Stores admin user credentials.

| Column | Type | Description |
|--------|------|-------------|
| `id` | TEXT (UUID) | Primary key |
| `email` | TEXT | Email (unique) |
| `password_hash` | TEXT | Bcrypt hash |
| `created_at` | TEXT | ISO 8601 timestamp |

## Schema

```sql
CREATE TABLE IF NOT EXISTS offices (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  location TEXT,
  description TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  contact_address TEXT,
  photos TEXT DEFAULT '[]',
  published INTEGER DEFAULT 1,
  created_at TEXT,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS admins (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TEXT
);
```

## Backup & Restore

### Backup
```bash
# Simple file copy
cp data/offices.db backups/offices-$(date +%Y%m%d-%H%M%S).db

# Using SQLite dump
sqlite3 data/offices.db .dump > backups/offices-$(date +%Y%m%d).sql
```

### Restore
```bash
# From file copy
cp backups/offices-YYYYMMDD.db data/offices.db

# From SQL dump
sqlite3 data/offices.db < backups/offices-YYYYMMDD.sql
```

## Reset Database

To reset (WARNING: deletes all data):
```bash
rm data/offices.db
npm start  # Re-creates the database with default admin
```

## Photo Storage

Photos are stored in `public/uploads/<office-id>/` and referenced in the `photos` JSON column as URL paths like `/uploads/<office-id>/photo_<timestamp>.webp`.

Photos are processed with Sharp:
- Resized to fit within 1200×800px
- Converted to WebP format
- Compressed to approximately 200KB
