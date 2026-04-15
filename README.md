# Office CMS

A production-ready Office Directory Management System built with Node.js, Express, SQLite, and Vanilla JavaScript.

## Features

### Admin Dashboard (Password-Protected)
- Secure login with bcrypt password hashing
- Full CRUD for offices (Create, Read, Update, Delete)
- Edit: name, location, description, contact (email, phone, address)
- Photo management: drag-and-drop, max 5 per office, auto-compress
- Session-based authentication

### Public Frontend
- Office directory grid (responsive: 1–4 columns)
- Office cards with photo, name, location, description
- Individual office detail pages
- Photo carousels with 4-second auto-advance, fade transitions, swipe support
- Mobile-first responsive design
- SEO meta tags and structured data

## Tech Stack

- **Backend:** Node.js 18+, Express.js, SQLite3
- **Frontend:** HTML5, CSS3, Vanilla JavaScript
- **Security:** Bcryptjs, express-session, helmet, express-rate-limit, express-validator
- **Images:** Multer, Sharp

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your settings

# 3. Start server
npm start

# 4. Open browser
open http://localhost:3000

# Admin login at:
open http://localhost:3000/admin
```

## Default Credentials (CHANGE IN PRODUCTION)

- **Email:** `admin@offices.local`
- **Password:** `changeme123`

## Directory Structure

```
office-cms/
├── public/          # Static assets (CSS, JS, images, uploads)
├── src/             # Backend source code
│   ├── routes/      # Express routes
│   ├── controllers/ # Route handlers
│   ├── middleware/  # Auth, validation, rate limiting
│   ├── models/      # Database queries
│   ├── config/      # Configuration
│   └── db/          # Database init and schema
├── views/           # HTML views
│   ├── admin/       # Admin dashboard pages
│   └── public/      # Public-facing pages
├── data/            # SQLite database (auto-created)
├── server.js        # Main entry point
└── package.json
```

## VS Code Debugging

Press **F5** in VS Code to start with the debugger attached.

## Documentation

- [SETUP.md](SETUP.md) — Development setup guide
- [DEPLOYMENT.md](DEPLOYMENT.md) — Production deployment
- [API.md](API.md) — API reference
- [DATABASE.md](DATABASE.md) — Database schema

## License

MIT
