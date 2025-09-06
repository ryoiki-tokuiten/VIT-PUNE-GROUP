const UserModel = require('../models/user.model');
const { hashPassword, comparePassword, generateToken, validatePassword } = require('../utils/security');

/**
 * Authentication controller
 */
class AuthController {
  /**
   * Register a new user
   */
  static async register(req, res) {
    try {
      const { username, full_name, password } = req.body;

      // Validate required fields
      if (!username || !full_name || !password) {
        return res.status(400).json({
          success: false,
          message: 'Username, full name, and password are required'
        });
      }

      // Validate username format
      const usernameRegex = /^[a-zA-Z0-9_]+$/;
      if (!usernameRegex.test(username)) {
        return res.status(400).json({
          success: false,
          message: 'Username can only contain letters, numbers, and underscores'
        });
      }

      if (username.length < 3 || username.length > 20) {
        return res.status(400).json({
          success: false,
          message: 'Username must be between 3 and 20 characters'
        });
      }

      // Validate full name
      if (full_name.length < 2 || full_name.length > 50) {
        return res.status(400).json({
          success: false,
          message: 'Full name must be between 2 and 50 characters'
        });
      }

      // Validate password strength
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.isValid) {
        return res.status(400).json({
          success: false,
          message: 'Password does not meet requirements',
          errors: passwordValidation.errors
        });
      }

      // Check if username already exists
      const existingUser = await UserModel.findByUsername(username.toLowerCase());
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'Username already exists'
        });
      }

      // Hash password
      const password_hash = await hashPassword(password);

      // Create user
      const user = await UserModel.create({
        username: username.toLowerCase(),
        full_name: full_name.trim(),
        password_hash
      });

      // Generate JWT token
      const token = generateToken({
        userId: user.id,
        username: user.username
      });

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          user: {
            id: user.id,
            username: user.username,
            full_name: user.full_name,
            created_at: user.created_at
          },
          token
        }
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Login user
   */
  static async login(req, res) {
    try {
      const { username, password } = req.body;

      // Validate required fields
      if (!username || !password) {
        return res.status(400).json({
          success: false,
          message: 'Username and password are required'
        });
      }

      // Find user by username
      const user = await UserModel.findByUsername(username.toLowerCase());
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      // Verify password
      const isPasswordValid = await comparePassword(password, user.password_hash);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      // Generate JWT token
      const token = generateToken({
        userId: user.id,
        username: user.username
      });

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: user.id,
            username: user.username,
            full_name: user.full_name,
            created_at: user.created_at
          },
          token
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get current user profile
   */
  static async getProfile(req, res) {
    try {
      const user = await UserModel.findByIdWithStats(req.user.id);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.json({
        success: true,
        data: { user }
      });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Update user profile
   */
  static async updateProfile(req, res) {
    try {
      const { full_name } = req.body;
      const updates = {};

      if (full_name !== undefined) {
        if (full_name.length < 2 || full_name.length > 50) {
          return res.status(400).json({
            success: false,
            message: 'Full name must be between 2 and 50 characters'
          });
        }
        updates.full_name = full_name.trim();
      }

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No valid fields to update'
        });
      }

      const updatedUser = await UserModel.update(req.user.id, updates);

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: { user: updatedUser }
      });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Verify token (for protected route testing)
   */
  static async verifyToken(req, res) {
    res.json({
      success: true,
      message: 'Token is valid',
      data: {
        user: req.user
      }
    });
  }
}

module.exports = AuthController;
