const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const os = require('os');
const { requireAuth } = require('../middleware/auth');
const { uploadPhoto, deletePhoto } = require('../controllers/uploadController');
const { apiLimiter } = require('../middleware/rateLimit');
const { ALLOWED_MIME_TYPES } = require('../config/constants');

const upload = multer({
  dest: os.tmpdir(),
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE, 10) || 5242880, // 5MB
    files: 1,
  },
  fileFilter(req, file, cb) {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, and WebP images are allowed'));
    }
  },
});

router.post('/:officeId', requireAuth, apiLimiter, upload.single('photo'), uploadPhoto);
router.delete('/:officeId/:photoIndex', requireAuth, apiLimiter, deletePhoto);

module.exports = router;
