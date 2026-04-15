const rateLimit = require('express-rate-limit');
const { AUTH_RATE_LIMIT_MAX, AUTH_RATE_LIMIT_WINDOW, API_RATE_LIMIT_MAX, API_RATE_LIMIT_WINDOW } = require('../config/constants');

const authLimiter = rateLimit({
  windowMs: AUTH_RATE_LIMIT_WINDOW,
  max: AUTH_RATE_LIMIT_MAX,
  message: { error: 'Too many login attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: API_RATE_LIMIT_WINDOW,
  max: API_RATE_LIMIT_MAX,
  message: { error: 'Too many requests. Please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { authLimiter, apiLimiter };
