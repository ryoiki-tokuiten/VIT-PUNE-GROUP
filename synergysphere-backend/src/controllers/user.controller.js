const UserModel = require('../models/user.model');

/**
 * User controller
 */
class UserController {
  /**
   * Search users by username
   */
  static async searchUsers(req, res) {
    try {
      const { username } = req.query;

      if (!username || username.trim().length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Search term must be at least 2 characters long'
        });
      }

      const users = await UserModel.searchByUsername(username.trim(), 20);

      res.json({
        success: true,
        data: { users }
      });
    } catch (error) {
      console.error('Search users error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get user by ID
   */
  static async getUserById(req, res) {
    try {
      const { id } = req.params;

      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid user ID'
        });
      }

      const user = await UserModel.findById(parseInt(id));

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
      console.error('Get user error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get user's projects
   */
  static async getUserProjects(req, res) {
    try {
      const projects = await UserModel.getUserProjects(req.user.id);

      res.json({
        success: true,
        data: { projects }
      });
    } catch (error) {
      console.error('Get user projects error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Check if username is available
   */
  static async checkUsername(req, res) {
    try {
      const { username } = req.params;

      if (!username || username.length < 3) {
        return res.status(400).json({
          success: false,
          message: 'Username must be at least 3 characters long'
        });
      }

      const exists = await UserModel.usernameExists(username.toLowerCase());

      res.json({
        success: true,
        data: {
          username: username.toLowerCase(),
          available: !exists
        }
      });
    } catch (error) {
      console.error('Check username error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
}

module.exports = UserController;
