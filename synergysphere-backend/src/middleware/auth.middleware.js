const { verifyToken } = require('../utils/security');
const { query } = require('../config/db');

/**
 * Middleware to verify JWT token and authenticate users
 */
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token is required'
      });
    }

    // Verify the token
    const decoded = verifyToken(token);
    
    // Get user from database to ensure user still exists
    const userResult = await query(
      'SELECT id, username, full_name, created_at FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token - user not found'
      });
    }

    // Add user info to request object
    req.user = userResult.rows[0];
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Authentication error'
    });
  }
};

/**
 * Middleware to check if user is a project member
 */
const checkProjectMember = async (req, res, next) => {
  try {
    const projectId = req.params.projectId || req.body.projectId;
    const userId = req.user.id;

    if (!projectId) {
      return res.status(400).json({
        success: false,
        message: 'Project ID is required'
      });
    }

    // Check if user is a member of the project
    const memberResult = await query(
      'SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2',
      [projectId, userId]
    );

    if (memberResult.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Access denied - not a project member'
      });
    }

    req.userRole = memberResult.rows[0].role;
    next();
  } catch (error) {
    console.error('Project member check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error checking project membership'
    });
  }
};

/**
 * Middleware to check if user has admin or owner role in project
 */
const checkProjectAdmin = async (req, res, next) => {
  try {
    const projectId = req.params.projectId || req.body.projectId;
    const userId = req.user.id;

    const memberResult = await query(
      'SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2',
      [projectId, userId]
    );

    if (memberResult.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Access denied - not a project member'
      });
    }

    const role = memberResult.rows[0].role;
    if (role !== 'Owner' && role !== 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied - admin privileges required'
      });
    }

    req.userRole = role;
    next();
  } catch (error) {
    console.error('Project admin check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error checking admin privileges'
    });
  }
};

module.exports = {
  authenticateToken,
  checkProjectMember,
  checkProjectAdmin
};
