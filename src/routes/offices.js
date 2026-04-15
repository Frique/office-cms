const express = require('express');
const router = express.Router();
const path = require('path');
const { listOffices, getOffice } = require('../controllers/officeController');
const { apiLimiter } = require('../middleware/rateLimit');

// Public HTML pages
router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../../views/public/index.html'));
});

router.get('/office/:id', (req, res) => {
  res.sendFile(path.join(__dirname, '../../views/public/office.html'));
});

// Public API
router.get('/api/offices', apiLimiter, listOffices);
router.get('/api/offices/:id', apiLimiter, getOffice);

module.exports = router;
