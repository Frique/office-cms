const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const officeModel = require('../models/officeModel');
const { MAX_PHOTOS_PER_OFFICE, MAX_IMAGE_WIDTH, MAX_IMAGE_HEIGHT } = require('../config/constants');

// Validate that a string is a UUID v4 to prevent path traversal
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isValidUUID(str) {
  return UUID_PATTERN.test(str);
}

async function uploadPhoto(req, res) {
  try {
    const { officeId } = req.params;

    if (!isValidUUID(officeId)) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'Invalid office ID' });
    }

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

    // Build the office upload directory using the validated UUID
    const uploadDir = path.resolve(process.env.UPLOAD_DIR || './public/uploads');
    const officeDir = path.join(uploadDir, officeId);

    // Ensure officeDir is still within uploadDir (extra safety)
    if (!(officeDir.startsWith(uploadDir + path.sep) || officeDir === uploadDir)) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'Invalid office ID' });
    }

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

    if (!isValidUUID(officeId)) {
      return res.status(400).json({ error: 'Invalid office ID' });
    }

    const office = await officeModel.getOfficeById(officeId);
    if (!office) {
      return res.status(404).json({ error: 'Office not found' });
    }

    if (isNaN(idx) || idx < 0 || idx >= office.photos.length) {
      return res.status(400).json({ error: 'Invalid photo index' });
    }

    const photoUrl = office.photos[idx];

    // Only delete files whose URL starts with /uploads/<officeId>/
    // This prevents any attempt to delete files outside the uploads folder
    const expectedPrefix = `/uploads/${officeId}/`;
    if (typeof photoUrl !== 'string' || !photoUrl.startsWith(expectedPrefix)) {
      return res.status(400).json({ error: 'Invalid photo reference' });
    }

    const uploadDir = path.resolve(process.env.UPLOAD_DIR || './public/uploads');
    // Reconstruct path from officeId and filename only — never trust the raw photoUrl for path building
    const filename = path.basename(photoUrl);
    const filePath = path.join(uploadDir, officeId, filename);

    // Final safety check: ensure file is within uploads dir
    if (filePath.startsWith(uploadDir + path.sep) && fs.existsSync(filePath)) {
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
