const express = require('express');
const authController = require('../../controllers/v1/authController');
const { authenticateToken } = require('../../middleware/auth');
const { validate, authSchemas } = require('../../middleware/validation');
const { uploadProfilePicture } = require('../../middleware/upload');

const router = express.Router();

// Public routes
router.post('/register', validate(authSchemas.register), authController.register);
router.post('/login', validate(authSchemas.login), authController.login);
router.post('/refresh', authController.refreshToken);

// Protected routes
router.post('/logout', authenticateToken, authController.logout);
router.get('/profile', authenticateToken, authController.getProfile);

// Profile update with optional photo upload
router.patch('/profile', 
  authenticateToken, 
  uploadProfilePicture,
  validate(authSchemas.updateProfile), 
  authController.updateProfile
);

// Delete profile picture
router.delete('/profile/picture', authenticateToken, authController.deleteProfilePicture);

module.exports = router;