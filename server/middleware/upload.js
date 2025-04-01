const multer = require('multer');
const fs = require('fs');
const path = require('path');

// Use memory storage instead of disk storage since we're using S3
const storage = multer.memoryStorage();

// Create multer instance without field configuration
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB file size limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed!'), false);
    }
  }
});

// Clean up temporary files
const cleanupTemp = () => {
  const uploadsDir = path.join(__dirname, '../uploads');
  if (fs.existsSync(uploadsDir)) {
    fs.readdir(uploadsDir, (err, files) => {
      if (err) console.error('Error reading uploads directory:', err);
      for (const file of files) {
        fs.unlink(path.join(uploadsDir, file), err => {
          if (err) console.error('Error deleting temp file:', err);
        });
      }
    });
  }
};

// Run cleanup periodically
setInterval(cleanupTemp, 1000 * 60 * 60); // Clean every hour

module.exports = upload; 