# Setup Guide

## Prerequisites

- Node.js 18 or higher ([download](https://nodejs.org))
- npm 8 or higher (included with Node.js)
- Git

## Installation

```bash
# Clone the repository (or unzip the project)
git clone https://github.com/your-username/office-cms.git
cd office-cms

# Install dependencies
npm install

# Copy environment file
cp .env.example .env
```

## Environment Configuration

Edit `.env`:

```env
PORT=3000
NODE_ENV=development
SESSION_SECRET=your-long-random-secret-minimum-32-chars
ADMIN_EMAIL=admin@yourcompany.com
ADMIN_PASSWORD=your-secure-password
DATABASE_PATH=./data/offices.db
UPLOAD_DIR=./public/uploads
MAX_FILE_SIZE=5242880
```

> ⚠️ **Change the SESSION_SECRET and admin credentials before deploying!**

## Running in Development

```bash
npm start
```

The server starts at `http://localhost:3000`.

## VS Code Debugging

1. Open the project folder in VS Code
2. Press **F5** (or click Run > Start Debugging)
3. Select "Launch Office CMS"
4. The browser opens automatically

Set breakpoints in any `.js` file and they'll be hit during requests.

## Admin Login

1. Visit `http://localhost:3000/admin/login`
2. Enter credentials from your `.env` file:
   - Email: `admin@offices.local` (default)
   - Password: `changeme123` (default)

## Adding Sample Offices

1. Log in to admin dashboard
2. Click "New Office"
3. Fill in name, location, description
4. Upload photos (drag and drop)
5. Click "Save Office"

## Project Structure

| Path | Purpose |
|------|---------|
| `server.js` | Express app entry point |
| `src/routes/` | Route definitions |
| `src/controllers/` | Business logic |
| `src/middleware/` | Auth, validation, rate limiting |
| `src/models/` | Database queries |
| `src/db/` | Schema and initialization |
| `src/config/` | App configuration |
| `views/admin/` | Admin HTML pages |
| `views/public/` | Public HTML pages |
| `public/css/` | Stylesheets |
| `public/js/` | Client-side JavaScript |
| `public/uploads/` | Uploaded photos |
| `data/` | SQLite database file |

## Common Issues

### Port already in use
```bash
# Find and kill the process
lsof -i :3000
kill -9 <PID>
```

### Database locked
Delete `data/offices.db` to reset the database (loses all data).

### Image upload fails
- Check `public/uploads/` folder exists and is writable
- Ensure file is under 5MB
- Supported formats: JPEG, PNG, WebP

### Admin password forgotten
Reset by editing `ADMIN_PASSWORD` in `.env`, then delete the database to recreate the admin user.
