const path = require('path');
const fs = require('fs');
const officeModel = require('../models/officeModel');

// Validate UUID v4 to prevent path traversal
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isValidUUID(str) {
  return UUID_PATTERN.test(str);
}

async function listOffices(req, res) {
  try {
    const includeAll = req.session && req.session.adminId;
    const offices = await officeModel.getAllOffices(includeAll);
    res.json({ offices });
  } catch (err) {
    console.error('List offices error:', err);
    res.status(500).json({ error: 'Failed to fetch offices' });
  }
}

async function getOffice(req, res) {
  try {
    const office = await officeModel.getOfficeById(req.params.id);
    if (!office) {
      return res.status(404).json({ error: 'Office not found' });
    }
    res.json({ office });
  } catch (err) {
    console.error('Get office error:', err);
    res.status(500).json({ error: 'Failed to fetch office' });
  }
}

async function createOffice(req, res) {
  try {
    const office = await officeModel.createOffice(req.body);
    res.status(201).json({ office });
  } catch (err) {
    console.error('Create office error:', err);
    res.status(500).json({ error: 'Failed to create office' });
  }
}

async function updateOffice(req, res) {
  try {
    const existing = await officeModel.getOfficeById(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Office not found' });
    }
    await officeModel.updateOffice(req.params.id, req.body);
    const updated = await officeModel.getOfficeById(req.params.id);
    res.json({ office: updated });
  } catch (err) {
    console.error('Update office error:', err);
    res.status(500).json({ error: 'Failed to update office' });
  }
}

async function deleteOffice(req, res) {
  try {
    const officeId = req.params.id;

    if (!isValidUUID(officeId)) {
      return res.status(400).json({ error: 'Invalid office ID' });
    }

    const existing = await officeModel.getOfficeById(officeId);
    if (!existing) {
      return res.status(404).json({ error: 'Office not found' });
    }

    // Delete associated photos from disk safely using validated UUID
    const uploadDir = path.resolve(process.env.UPLOAD_DIR || './public/uploads');
    const officeDir = path.join(uploadDir, officeId);

    // Ensure officeDir is within uploadDir
    if ((officeDir.startsWith(uploadDir + path.sep) || officeDir === uploadDir) && fs.existsSync(officeDir)) {
      fs.rmSync(officeDir, { recursive: true, force: true });
    }

    await officeModel.deleteOffice(officeId);
    res.json({ success: true });
  } catch (err) {
    console.error('Delete office error:', err);
    res.status(500).json({ error: 'Failed to delete office' });
  }
}

module.exports = { listOffices, getOffice, createOffice, updateOffice, deleteOffice };
