const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const officeModel = require('../models/officeModel');
const { MAX_PHOTOS_PER_OFFICE, MAX_IMAGE_WIDTH, MAX_IMAGE_HEIGHT, TARGET_FILE_SIZE } = require('../config/constants');

async function uploadPhoto(req, res) {
  try {
    const { officeId } = req.params;

    const office = await officeModel.getOfficeById(officeId);
    if (!office) {
      // Clean up uploaded file if office not found
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(404).json({ error: 'Office not found' });
    }

    if (office.photos.length >= MAX_PHOTOS_PER_OFFICE) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: `Maximum ${MAX_PHOTOS_PER_OFFICE} photos per office` });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Process and optimize image
    const uploadDir = process.env.UPLOAD_DIR || './public/uploads';
    const officeDir = path.join(uploadDir, officeId);
    if (!fs.existsSync(officeDir)) {
      fs.mkdirSync(officeDir, { recursive: true });
    }

    const filename = `photo_${Date.now()}.webp`;
    const outputPath = path.join(officeDir, filename);

    await sharp(req.file.path)
      .resize(MAX_IMAGE_WIDTH, MAX_IMAGE_HEIGHT, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(outputPath);

    // Clean up temp file
    fs.unlinkSync(req.file.path);

    const photoUrl = `/uploads/${officeId}/${filename}`;
    const updatedPhotos = [...office.photos, photoUrl];

    await officeModel.updateOffice(officeId, { photos: updatedPhotos });

    res.json({ success: true, url: photoUrl, photos: updatedPhotos });
  } catch (err) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Failed to upload photo' });
  }
}

async function deletePhoto(req, res) {
  try {
    const { officeId, photoIndex } = req.params;
    const idx = parseInt(photoIndex, 10);

    const office = await officeModel.getOfficeById(officeId);
    if (!office) {
      return res.status(404).json({ error: 'Office not found' });
    }

    if (isNaN(idx) || idx < 0 || idx >= office.photos.length) {
      return res.status(400).json({ error: 'Invalid photo index' });
    }

    const photoUrl = office.photos[idx];
    const uploadDir = process.env.UPLOAD_DIR || './public/uploads';
    const filePath = path.join(uploadDir, '..', photoUrl);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    const updatedPhotos = office.photos.filter((_, i) => i !== idx);
    await officeModel.updateOffice(officeId, { photos: updatedPhotos });

    res.json({ success: true, photos: updatedPhotos });
  } catch (err) {
    console.error('Delete photo error:', err);
    res.status(500).json({ error: 'Failed to delete photo' });
  }
}

module.exports = { uploadPhoto, deletePhoto };
