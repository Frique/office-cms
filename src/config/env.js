require('dotenv').config();

module.exports = {
  port: parseInt(process.env.PORT, 10) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  sessionSecret: process.env.SESSION_SECRET || 'dev-secret-change-in-production',
  adminEmail: process.env.ADMIN_EMAIL || 'admin@offices.local',
  adminPassword: process.env.ADMIN_PASSWORD || 'changeme123',
  databasePath: process.env.DATABASE_PATH || './data/offices.db',
  uploadDir: process.env.UPLOAD_DIR || './public/uploads',
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE, 10) || 5242880, // 5MB
};
