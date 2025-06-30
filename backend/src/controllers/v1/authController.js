const authService = require('../../services/authService');
const responseHelper = require('../../utils/responseHelper');
const logger = require('../../utils/logger');

class AuthController {
  async register(req, res, next) {
    try {
      const result = await authService.registerUser(req.body);
      
      responseHelper.success(
        res,
        'User registered successfully',
        result,
        201
      );
    } catch (error) {
      if (error.message === 'User with this email already exists') {
        return responseHelper.error(
          res,
          error.message,
          409,
          'DUPLICATE_EMAIL'
        );
      }
      next(error);
    }
  }

  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const result = await authService.loginUser(email, password);
      
      responseHelper.success(
        res,
        'Login successful',
        result
      );
    } catch (error) {
      if (error.message === 'Invalid email or password') {
        return responseHelper.unauthorized(res, error.message);
      }
      next(error);
    }
  }

  async refreshToken(req, res, next) {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return responseHelper.unauthorized(res, 'Refresh token is required');
      }

      const refreshToken = authHeader.substring(7);
      const result = await authService.refreshToken(refreshToken);
      
      responseHelper.success(
        res,
        'Token refreshed successfully',
        result
      );
    } catch (error) {
      if (error.message.includes('token') || error.message.includes('revoked')) {
        return responseHelper.unauthorized(res, 'Invalid or expired refresh token');
      }
      next(error);
    }
  }

  async logout(req, res, next) {
    try {
      await authService.logoutUser(req.user.id);
      
      responseHelper.success(
        res,
        'Logged out successfully'
      );
    } catch (error) {
      next(error);
    }
  }

  async getProfile(req, res, next) {
    try {
      const profile = await authService.getUserProfile(req.user.id);
      
      responseHelper.success(
        res,
        'Profile retrieved successfully',
        { user: profile }
      );
    } catch (error) {
      if (error.message === 'User not found') {
        return responseHelper.notFound(res, error.message);
      }
      next(error);
    }
  }

  async updateProfile(req, res, next) {
    try {
      const updatedUser = await authService.updateUserProfile(
        req.user.id, 
        req.body, 
        req.file
      );
      
      responseHelper.success(
        res,
        'Profile updated successfully',
        { user: updatedUser }
      );
    } catch (error) {
      if (error.message === 'User not found') {
        return responseHelper.notFound(res, error.message);
      }
      next(error);
    }
  }

  async deleteProfilePicture(req, res, next) {
    try {
      const updatedUser = await authService.deleteProfilePicture(req.user.id);
      
      responseHelper.success(
        res,
        'Profile picture deleted successfully',
        { user: updatedUser }
      );
    } catch (error) {
      if (error.message === 'User not found') {
        return responseHelper.notFound(res, error.message);
      }
      if (error.message === 'No profile picture to delete') {
        return responseHelper.error(res, error.message, 400, 'NO_PROFILE_PICTURE');
      }
      next(error);
    }
  }
}

module.exports = new AuthController();