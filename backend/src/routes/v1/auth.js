const express = require('express');
const authController = require('../../controllers/v1/authController');
const { authenticateToken } = require('../../middleware/auth');
const { validate, authSchemas } = require('../../middleware/validation');
const { uploadProfilePicture } = require('../../middleware/upload');

const router = express.Router();

// Defines public routes that do not require authentication.
// Route for user registration.
router.post('/register', validate(authSchemas.register), authController.register);
// Route for user login.
router.post('/login', validate(authSchemas.login), authController.login);
// Route for refreshing an access token.
router.post('/refresh', authController.refreshToken);

// Defines protected routes that require a valid JWT for access.
// Route for user logout.
router.post('/logout', authenticateToken, authController.logout);
// Route to retrieve the user's profile.
router.get('/profile', authenticateToken, authController.getProfile);

// Route to update the user's profile, with optional profile picture upload.
router.patch('/profile', 
  authenticateToken, 
  uploadProfilePicture,
  validate(authSchemas.updateProfile), 
  authController.updateProfile
);


// Route to delete the user's profile picture.
router.delete('/profile/picture', authenticateToken, authController.deleteProfilePicture);

module.exports = router;