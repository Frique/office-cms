require('dotenv').config();

const express = require('express');
const session = require('express-session');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const path = require('path');

const { initializeDatabase } = require('./src/db/init');
const { errorHandler } = require('./src/middleware/errorHandler');
const { apiLimiter } = require('./src/middleware/rateLimit');
const officesRouter = require('./src/routes/offices');
const adminRouter = require('./src/routes/admin');
const authRouter = require('./src/routes/auth');
const uploadsRouter = require('./src/routes/uploads');

const app = express();
const PORT = parseInt(process.env.PORT, 10) || 3000;
const SESSION_SECRET = process.env.SESSION_SECRET || 'dev-secret-please-change';
const isProd = process.env.NODE_ENV === 'production';

// Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'fonts.googleapis.com', 'cdn.jsdelivr.net'],
      fontSrc: ["'self'", 'fonts.gstatic.com'],
      scriptSrc: ["'self'", "'unsafe-inline'", 'cdn.jsdelivr.net'],
      imgSrc: ["'self'", 'data:', 'blob:'],
      connectSrc: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// Compression
app.use(compression());

// CORS - only allow same-origin requests (disable cross-origin for APIs)
// The app is intended to be served from a single domain
if (!isProd) {
  // In development, allow localhost origins only
  app.use(cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (same-origin, curl, etc.)
      if (!origin) return callback(null, true);
      // Allow localhost in development
      if (/^https?:\/\/localhost(:\d+)?$/.test(origin) ||
          /^https?:\/\/127\.0\.0\.1(:\d+)?$/.test(origin)) {
        return callback(null, true);
      }
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  }));
}

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Session
app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: isProd,
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  },
}));

// CSRF protection for state-changing API requests
// Uses double-submit cookie pattern: check that the Origin/Referer matches the host
app.use((req, res, next) => {
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
  if (safeMethods.includes(req.method)) return next();

  // Only enforce for API/auth endpoints
  const isApiRoute = req.path.startsWith('/auth') ||
                     req.path.startsWith('/admin/api') ||
                     req.path.startsWith('/api/');
  if (!isApiRoute) return next();

  const origin = req.headers.origin;
  const referer = req.headers.referer;
  const host = req.headers.host;

  if (!host) return res.status(403).json({ error: 'Forbidden' });

  const allowedOrigin = `${isProd ? 'https' : 'http'}://${host}`;

  if (origin) {
    if (origin !== allowedOrigin) {
      return res.status(403).json({ error: 'Forbidden: invalid origin' });
    }
  } else if (referer) {
    try {
      const refererUrl = new URL(referer);
      if (refererUrl.origin !== allowedOrigin) {
        return res.status(403).json({ error: 'Forbidden: invalid referer' });
      }
    } catch {
      return res.status(403).json({ error: 'Forbidden' });
    }
  }
  // If neither origin nor referer is present (e.g., same-origin curl in dev), allow it
  next();
});

// Static files
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: isProd ? '1d' : 0,
  setHeaders(res, filePath) {
    if (filePath.endsWith('.webp') || filePath.endsWith('.jpg') || filePath.endsWith('.png')) {
      res.setHeader('Cache-Control', 'public, max-age=86400');
    }
  },
}));

// Routes
app.use('/auth', authRouter);
app.use('/admin', adminRouter);
app.use('/api/upload', uploadsRouter);
app.use('/', officesRouter);

// 404 handler (rate limited to prevent enumeration)
app.use(apiLimiter, (req, res) => {
  if (req.xhr || req.headers.accept?.includes('application/json')) {
    return res.status(404).json({ error: 'Not found' });
  }
  res.status(404).sendFile(path.join(__dirname, 'views/public/index.html'));
});

// Error handler
app.use(errorHandler);

// Start server
async function start() {
  try {
    await initializeDatabase();
    app.listen(PORT, () => {
      console.log(`\n🌿 Office CMS running at http://localhost:${PORT}`);
      console.log(`   Admin dashboard: http://localhost:${PORT}/admin`);
      console.log(`   Environment: ${process.env.NODE_ENV || 'development'}\n`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();

module.exports = app;
