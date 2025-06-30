const User = require('../models/User');
const { generateAccessToken, generateRefreshToken } = require('../config/jwt');
const logger = require('../utils/logger');
const path = require('path');
const fs = require('fs').promises;

class AuthService {
  async registerUser(userData) {
    try {
      // Check if user already exists
      const existingUser = await User.findOne({ 
        email: userData.email,
        isActive: true 
      });

      if (existingUser) {
        throw new Error('User with this email already exists');
      }

      // Create new user
      const user = new User(userData);
      await user.save();

      // Generate tokens
      const tokenPayload = {
        userId: user._id,
        email: user.email,
        tokenVersion: user.tokenVersion,
      };

      const accessToken = generateAccessToken(tokenPayload);
      const refreshToken = generateRefreshToken({
        userId: user._id,
        tokenVersion: user.tokenVersion,
      });

      logger.info(`New user registered: ${user.email}`);

      return {
        user: user.toJSON(),
        accessToken,
        refreshToken,
      };
    } catch (error) {
      logger.error('Registration error:', error);
      throw error;
    }
  }

  async loginUser(email, password) {
    try {
      // Find user with password
      const user = await User.findByEmailWithPassword(email);

      if (!user) {
        throw new Error('Invalid email or password');
      }

      // Check password
      const isPasswordValid = await user.comparePassword(password);
      
      if (!isPasswordValid) {
        throw new Error('Invalid email or password');
      }

      // Update last login
      await user.updateLastLogin();

      // Generate tokens
      const tokenPayload = {
        userId: user._id,
        email: user.email,
        groupId: user.groupId,
        tokenVersion: user.tokenVersion,
      };

      const accessToken = generateAccessToken(tokenPayload);
      const refreshToken = generateRefreshToken({
        userId: user._id,
        tokenVersion: user.tokenVersion,
      });

      logger.info(`User logged in: ${user.email}`);

      return {
        user: user.toJSON(),
        accessToken,
        refreshToken,
      };
    } catch (error) {
      logger.error('Login error:', error);
      throw error;
    }
  }

  async refreshToken(refreshToken) {
    try {
      const { verifyRefreshToken } = require('../config/jwt');
      const decoded = verifyRefreshToken(refreshToken);

      // Find user
      const user = await User.findById(decoded.userId);
      
      if (!user || !user.isActive) {
        throw new Error('User not found or inactive');
      }

      // Check token version
      if (decoded.tokenVersion !== user.tokenVersion) {
        throw new Error('Refresh token has been revoked');
      }

      // Generate new access token
      const tokenPayload = {
        userId: user._id,
        email: user.email,
        groupId: user.groupId,
        tokenVersion: user.tokenVersion,
      };

      const newAccessToken = generateAccessToken(tokenPayload);

      return {
        accessToken: newAccessToken,
      };
    } catch (error) {
      logger.error('Token refresh error:', error);
      throw error;
    }
  }

  async logoutUser(userId) {
    try {
      const user = await User.findById(userId);
      
      if (user) {
        await user.revokeTokens(); // Increment token version to invalidate all tokens
        logger.info(`User logged out: ${user.email}`);
      }

      return true;
    } catch (error) {
      logger.error('Logout error:', error);
      throw error;
    }
  }

  async getUserProfile(userId) {
    try {
      const user = await User.findById(userId).populate({
        path: 'groupId',
        select: 'name inviteCode members statistics',
        populate: {
          path: 'members.userId',
          select: 'name email profilePicture'
        }
      });
      
      if (!user || !user.isActive) {
        throw new Error('User not found');
      }

      const userProfile = user.toJSON();
      
      // Add user's role in the group if they're in one
      if (userProfile.groupId && userProfile.groupId.members) {
        const member = userProfile.groupId.members.find(
          m => m.userId._id.toString() === userId
        );
        if (member) {
          userProfile.role = member.role;
        }
      }

      return userProfile;
    } catch (error) {
      logger.error('Get profile error:', error);
      throw error;
    }
  }

  async updateUserProfile(userId, updateData, profilePictureFile = null) {
    try {
      const user = await User.findById(userId);
      
      if (!user || !user.isActive) {
        throw new Error('User not found');
      }

      // Handle profile picture upload
      if (profilePictureFile) {
        // Delete old profile picture if exists
        if (user.profilePicture) {
          try {
            const oldPicturePath = path.join(__dirname, '../../uploads/profiles', path.basename(user.profilePicture));
            await fs.unlink(oldPicturePath);
          } catch (error) {
            logger.warn('Could not delete old profile picture:', error);
          }
        }
        
        // Set new profile picture URL
        user.profilePicture = `/uploads/profiles/${profilePictureFile.filename}`;
      }

      // Update other allowed fields
      if (updateData.name) user.name = updateData.name;
      if (updateData.preferences) {
        user.preferences = { ...user.preferences, ...updateData.preferences };
      }

      await user.save();

      logger.info(`User profile updated: ${user.email}`);

      return user.toJSON();
    } catch (error) {
      logger.error('Update profile error:', error);
      throw error;
    }
  }

  async deleteProfilePicture(userId) {
    try {
      const user = await User.findById(userId);
      
      if (!user || !user.isActive) {
        throw new Error('User not found');
      }

      if (!user.profilePicture) {
        throw new Error('No profile picture to delete');
      }

      // Delete file from filesystem
      try {
        const picturePath = path.join(__dirname, '../../uploads/profiles', path.basename(user.profilePicture));
        await fs.unlink(picturePath);
      } catch (error) {
        logger.warn('Could not delete profile picture file:', error);
      }

      // Remove from database
      user.profilePicture = null;
      await user.save();

      logger.info(`Profile picture deleted for user: ${user.email}`);

      return user.toJSON();
    } catch (error) {
      logger.error('Delete profile picture error:', error);
      throw error;
    }
  }
}

module.exports = new AuthService();