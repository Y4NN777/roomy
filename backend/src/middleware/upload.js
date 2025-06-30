const multer = require('multer');
const path = require('path');
const fs = require('fs');
const responseHelper = require('../utils/responseHelper');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../../uploads/profiles');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: userId_timestamp.extension
    const uniqueName = `${req.user.id}_${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

// File filter for images only
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG, PNG, and WebP images are allowed'), false);
  }
};

// Configure multer
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// Error handler for multer errors
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return responseHelper.error(
        res,
        'File size too large. Maximum size is 5MB',
        400,
        'FILE_TOO_LARGE'
      );
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return responseHelper.error(
        res,
        'Unexpected file field',
        400,
        'UNEXPECTED_FILE'
      );
    }
  }
  
  if (err.message === 'Only JPEG, PNG, and WebP images are allowed') {
    return responseHelper.error(
      res,
      err.message,
      400,
      'INVALID_FILE_TYPE'
    );
  }
  
  next(err);
};

// Middleware to handle single profile picture upload
const uploadProfilePicture = [
  upload.single('profilePicture'),
  handleUploadError,
];

module.exports = {
  uploadProfilePicture,
  uploadsDir,
};