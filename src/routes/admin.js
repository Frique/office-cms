const express = require('express');
const router = express.Router();
const path = require('path');
const { requireAuth } = require('../middleware/auth');
const { listOffices, getOffice, createOffice, updateOffice, deleteOffice } = require('../controllers/officeController');
const { officeValidators, handleValidationErrors } = require('../middleware/validation');
const { apiLimiter } = require('../middleware/rateLimit');

// Admin SPA pages
router.get('/login', (req, res) => {
  if (req.session && req.session.adminId) return res.redirect('/admin');
  res.sendFile(path.join(__dirname, '../../views/admin/login.html'));
});

router.get('/', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, '../../views/admin/dashboard.html'));
});

router.get('/office/new', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, '../../views/admin/office-form.html'));
});

router.get('/office/:id/edit', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, '../../views/admin/office-form.html'));
});

// Admin API
router.get('/api/offices', requireAuth, apiLimiter, listOffices);
router.post('/api/offices', requireAuth, apiLimiter, officeValidators, handleValidationErrors, createOffice);
router.put('/api/offices/:id', requireAuth, apiLimiter, officeValidators, handleValidationErrors, updateOffice);
router.delete('/api/offices/:id', requireAuth, apiLimiter, deleteOffice);

module.exports = router;
