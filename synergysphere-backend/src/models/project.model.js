const { query, getClient } = require('../config/db');

/**
 * Project model for database operations
 */
class ProjectModel {
  /**
   * Create a new project
   * @param {Object} projectData - Project data
   * @returns {Promise<Object>} - Created project
   */
  static async create({ name, description, creator_id }) {
    const client = await getClient();
    
    try {
      await client.query('BEGIN');
      
      // Create the project
      const projectResult = await client.query(
        'INSERT INTO projects (name, description, creator_id) VALUES ($1, $2, $3) RETURNING *',
        [name, description, creator_id]
      );
      
      const project = projectResult.rows[0];
      
      // Add creator as owner in project_members
      await client.query(
        'INSERT INTO project_members (project_id, user_id, role) VALUES ($1, $2, $3)',
        [project.id, creator_id, 'Owner']
      );
      
      // Log project creation activity
      await client.query(
        'INSERT INTO activity_logs (project_id, user_id, activity_type, details) VALUES ($1, $2, $3, $4)',
        [project.id, creator_id, 'PROJECT_CREATED', { project_name: name }]
      );
      
      await client.query('COMMIT');
      
      return project;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Find project by ID with details
   * @param {number} id - Project ID
   * @returns {Promise<Object|null>} - Project with details
   */
  static async findById(id) {
    const result = await query(`
      SELECT 
        p.*,
        u.username as creator_username,
        u.full_name as creator_name,
        COUNT(DISTINCT pm.user_id) as member_count,
        COUNT(DISTINCT t.id) as task_count
      FROM projects p
      JOIN users u ON p.creator_id = u.id
      LEFT JOIN project_members pm ON p.id = pm.project_id
      LEFT JOIN tasks t ON p.id = t.project_id
      WHERE p.id = $1
      GROUP BY p.id, u.username, u.full_name
    `, [id]);
    
    return result.rows[0] || null;
  }

  /**
   * Update project
   * @param {number} id - Project ID
   * @param {Object} updates - Updates to apply
   * @returns {Promise<Object>} - Updated project
   */
  static async update(id, updates) {
    const allowedFields = ['name', 'description'];
    const fields = [];
    const values = [];
    let paramCount = 1;

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
      `UPDATE projects SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    return result.rows[0];
  }

  /**
   * Delete project
   * @param {number} id - Project ID
   * @returns {Promise<boolean>} - Success status
   */
  static async delete(id) {
    const result = await query('DELETE FROM projects WHERE id = $1', [id]);
    return result.rowCount > 0;
  }

  /**
   * Get project members with roles
   * @param {number} projectId - Project ID
   * @returns {Promise<Array>} - Project members
   */
  static async getMembers(projectId) {
    const result = await query(`
      SELECT 
        u.id,
        u.username,
        u.full_name,
        pm.role,
        u.created_at as joined_date
      FROM project_members pm
      JOIN users u ON pm.user_id = u.id
      WHERE pm.project_id = $1
      ORDER BY 
        CASE pm.role 
          WHEN 'Owner' THEN 1 
          WHEN 'Admin' THEN 2 
          ELSE 3 
        END,
        u.full_name
    `, [projectId]);
    
    return result.rows;
  }

  /**
   * Add member to project
   * @param {number} projectId - Project ID
   * @param {number} userId - User ID
   * @param {string} role - User role
   * @returns {Promise<Object>} - Added member
   */
  static async addMember(projectId, userId, role = 'Member') {
    const client = await getClient();
    
    try {
      await client.query('BEGIN');
      
      // Add member
      await client.query(
        'INSERT INTO project_members (project_id, user_id, role) VALUES ($1, $2, $3)',
        [projectId, userId, role]
      );
      
      // Get member details
      const memberResult = await client.query(`
        SELECT u.id, u.username, u.full_name, pm.role
        FROM project_members pm
        JOIN users u ON pm.user_id = u.id
        WHERE pm.project_id = $1 AND pm.user_id = $2
      `, [projectId, userId]);
      
      // Log activity
      await client.query(
        'INSERT INTO activity_logs (project_id, user_id, activity_type, details) VALUES ($1, $2, $3, $4)',
        [projectId, userId, 'MEMBER_ADDED', { 
          user_id: userId, 
          username: memberResult.rows[0].username,
          role: role 
        }]
      );
      
      await client.query('COMMIT');
      
      return memberResult.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Update member role
   * @param {number} projectId - Project ID
   * @param {number} userId - User ID
   * @param {string} newRole - New role
   * @returns {Promise<boolean>} - Success status
   */
  static async updateMemberRole(projectId, userId, newRole) {
    const client = await getClient();
    
    try {
      await client.query('BEGIN');
      
      const result = await client.query(
        'UPDATE project_members SET role = $1 WHERE project_id = $2 AND user_id = $3 RETURNING role',
        [newRole, projectId, userId]
      );
      
      if (result.rowCount > 0) {
        // Log activity
        await client.query(
          'INSERT INTO activity_logs (project_id, user_id, activity_type, details) VALUES ($1, $2, $3, $4)',
          [projectId, userId, 'ROLE_UPDATED', { 
            user_id: userId,
            new_role: newRole 
          }]
        );
      }
      
      await client.query('COMMIT');
      
      return result.rowCount > 0;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Remove member from project
   * @param {number} projectId - Project ID
   * @param {number} userId - User ID
   * @returns {Promise<boolean>} - Success status
   */
  static async removeMember(projectId, userId) {
    const client = await getClient();
    
    try {
      await client.query('BEGIN');
      
      // Remove from project_members
      const result = await client.query(
        'DELETE FROM project_members WHERE project_id = $1 AND user_id = $2',
        [projectId, userId]
      );
      
      if (result.rowCount > 0) {
        // Remove from all task assignments in this project
        await client.query(`
          DELETE FROM task_assignees 
          WHERE user_id = $1 AND task_id IN (
            SELECT id FROM tasks WHERE project_id = $2
          )
        `, [userId, projectId]);
        
        // Log activity
        await client.query(
          'INSERT INTO activity_logs (project_id, user_id, activity_type, details) VALUES ($1, $2, $3, $4)',
          [projectId, userId, 'MEMBER_REMOVED', { user_id: userId }]
        );
      }
      
      await client.query('COMMIT');
      
      return result.rowCount > 0;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Check if user is project member
   * @param {number} projectId - Project ID
   * @param {number} userId - User ID
   * @returns {Promise<Object|null>} - Member info or null
   */
  static async getMemberRole(projectId, userId) {
    const result = await query(
      'SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2',
      [projectId, userId]
    );
    
    return result.rows[0] || null;
  }

  /**
   * Get project activity logs
   * @param {number} projectId - Project ID
   * @param {number} limit - Limit results
   * @returns {Promise<Array>} - Activity logs
   */
  static async getActivityLogs(projectId, limit = 50) {
    const result = await query(`
      SELECT 
        al.*,
        u.username,
        u.full_name,
        t.title as task_title
      FROM activity_logs al
      JOIN users u ON al.user_id = u.id
      LEFT JOIN tasks t ON al.task_id = t.id
      WHERE al.project_id = $1
      ORDER BY al.created_at DESC
      LIMIT $2
    `, [projectId, limit]);
    
    return result.rows;
  }
}

module.exports = ProjectModel;
