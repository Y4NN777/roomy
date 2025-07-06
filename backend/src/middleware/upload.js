// This file configures multer for handling file uploads, specifically for user profile pictures.
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const responseHelper = require('../utils/responseHelper');

// Ensures the directory for profile picture uploads exists, creating it if it doesn't.
const uploadsDir = path.join(__dirname, '../../uploads/profiles');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configures multer to handle file storage on disk.
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Generates a unique filename using the user's ID and a timestamp to prevent naming conflicts and ensure traceability.
    const uniqueName = `${req.user.id}_${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

// A file filter to ensure that only allowed image types are uploaded.
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG, PNG, and WebP images are allowed'), false);
  }
};

// Initializes multer with the defined storage, file filter, and size limits.
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // Sets a 5MB file size limit.
  },
});

// A custom error handler specifically for multer-related upload errors.
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

// A middleware pipeline that first handles a single profile picture upload and then processes any resulting errors.
const uploadProfilePicture = [
  upload.single('profilePicture'),
  handleUploadError,
];

module.exports = {
  uploadProfilePicture,
  uploadsDir,
};