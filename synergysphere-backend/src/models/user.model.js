const { query } = require('../config/db');

/**
 * User model for database operations
 */
class UserModel {
  /**
   * Create a new user
   * @param {Object} userData - User data
   * @returns {Promise<Object>} - Created user
   */
  static async create({ username, full_name, password_hash }) {
    const result = await query(
      'INSERT INTO users (username, full_name, password_hash) VALUES ($1, $2, $3) RETURNING id, username, full_name, created_at',
      [username, full_name, password_hash]
    );
    return result.rows[0];
  }

  /**
   * Find user by username
   * @param {string} username - Username to search for
   * @returns {Promise<Object|null>} - User object or null
   */
  static async findByUsername(username) {
    const result = await query(
      'SELECT id, username, full_name, password_hash, created_at FROM users WHERE username = $1',
      [username]
    );
    return result.rows[0] || null;
  }

  /**
   * Find user by ID
   * @param {number} id - User ID
   * @returns {Promise<Object|null>} - User object or null
   */
  static async findById(id) {
    const result = await query(
      'SELECT id, username, full_name, created_at FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  /**
   * Search users by username (partial match)
   * @param {string} searchTerm - Search term
   * @param {number} limit - Limit results
   * @returns {Promise<Array>} - Array of users
   */
  static async searchByUsername(searchTerm, limit = 10) {
    const result = await query(
      'SELECT id, username, full_name FROM users WHERE username ILIKE $1 LIMIT $2',
      [`%${searchTerm}%`, limit]
    );
    return result.rows;
  }

  /**
   * Get user with their project count
   * @param {number} id - User ID
   * @returns {Promise<Object|null>} - User with project count
   */
  static async findByIdWithStats(id) {
    const result = await query(`
      SELECT 
        u.id, 
        u.username, 
        u.full_name, 
        u.created_at,
        COUNT(DISTINCT pm.project_id) as project_count,
        COUNT(DISTINCT ta.task_id) as assigned_task_count
      FROM users u
      LEFT JOIN project_members pm ON u.id = pm.user_id
      LEFT JOIN task_assignees ta ON u.id = ta.user_id
      WHERE u.id = $1
      GROUP BY u.id, u.username, u.full_name, u.created_at
    `, [id]);
    return result.rows[0] || null;
  }

  /**
   * Update user profile
   * @param {number} id - User ID
   * @param {Object} updates - Updates to apply
   * @returns {Promise<Object>} - Updated user
   */
  static async update(id, updates) {
    const allowedFields = ['full_name'];
    const fields = [];
    const values = [];
    let paramCount = 1;

    // Build dynamic query for allowed fields
    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        fields.push(`${key} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    }

    if (fields.length === 0) {
      throw new Error('No valid fields to update');
    }

    values.push(id);
    const result = await query(
      `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING id, username, full_name, created_at`,
      values
    );

    return result.rows[0];
  }

  /**
   * Check if username exists
   * @param {string} username - Username to check
   * @returns {Promise<boolean>} - True if exists
   */
  static async usernameExists(username) {
    const result = await query(
      'SELECT 1 FROM users WHERE username = $1',
      [username]
    );
    return result.rows.length > 0;
  }

  /**
   * Get user's projects
   * @param {number} userId - User ID
   * @returns {Promise<Array>} - User's projects
   */
  static async getUserProjects(userId) {
    const result = await query(`
      SELECT 
        p.id,
        p.name,
        p.description,
        p.created_at,
        pm.role,
        u.username as creator_username,
        u.full_name as creator_name,
        COUNT(DISTINCT t.id) as task_count,
        COUNT(DISTINCT pm2.user_id) as member_count
      FROM projects p
      JOIN project_members pm ON p.id = pm.project_id
      JOIN users u ON p.creator_id = u.id
      LEFT JOIN tasks t ON p.id = t.project_id
      LEFT JOIN project_members pm2 ON p.id = pm2.project_id
      WHERE pm.user_id = $1
      GROUP BY p.id, p.name, p.description, p.created_at, pm.role, u.username, u.full_name
      ORDER BY p.created_at DESC
    `, [userId]);
    return result.rows;
  }
}

module.exports = UserModel;
