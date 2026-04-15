const express = require('express');
const router = express.Router();
const { login, logout, checkSession } = require('../controllers/authController');
const { loginValidators, handleValidationErrors } = require('../middleware/validation');
const { authLimiter } = require('../middleware/rateLimit');

router.post('/login', authLimiter, loginValidators, handleValidationErrors, login);
router.post('/logout', logout);
router.get('/check', checkSession);

module.exports = router;
