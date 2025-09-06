const { query, getClient } = require('../config/db');

/**
 * Project Invitation model for database operations
 */
class ProjectInvitationModel {
  /**
   * Create a new project invitation
   * @param {Object} invitationData - Invitation data
   * @returns {Promise<Object>} - Created invitation
   */
  static async create({ project_id, inviter_id, invitee_id, role = 'Member' }) {
    const result = await query(
      `INSERT INTO project_invitations (project_id, inviter_id, invitee_id, role) 
       VALUES ($1, $2, $3, $4) 
       ON CONFLICT (project_id, invitee_id) 
       DO UPDATE SET 
         inviter_id = EXCLUDED.inviter_id,
         role = EXCLUDED.role,
         status = 'pending',
         created_at = CURRENT_TIMESTAMP,
         responded_at = NULL
       RETURNING *`,
      [project_id, inviter_id, invitee_id, role]
    );
    return result.rows[0];
  }

  /**
   * Get invitation by ID
   * @param {number} invitationId - Invitation ID
   * @returns {Promise<Object>} - Invitation with project and user details
   */
  static async getById(invitationId) {
    const result = await query(
      `SELECT pi.*, 
              p.name as project_name, p.description as project_description,
              inviter.full_name as inviter_name, inviter.username as inviter_username,
              invitee.full_name as invitee_name, invitee.username as invitee_username
       FROM project_invitations pi
       JOIN projects p ON pi.project_id = p.id
       JOIN users inviter ON pi.inviter_id = inviter.id
       JOIN users invitee ON pi.invitee_id = invitee.id
       WHERE pi.id = $1`,
      [invitationId]
    );
    return result.rows[0];
  }

  /**
   * Get pending invitations for a user
   * @param {number} userId - User ID
   * @returns {Promise<Array>} - Pending invitations
   */
  static async getPendingByUserId(userId) {
    const result = await query(
      `SELECT pi.*, 
              p.name as project_name, p.description as project_description,
              inviter.full_name as inviter_name, inviter.username as inviter_username
       FROM project_invitations pi
       JOIN projects p ON pi.project_id = p.id
       JOIN users inviter ON pi.inviter_id = inviter.id
       WHERE pi.invitee_id = $1 AND pi.status = 'pending'
       ORDER BY pi.created_at DESC`,
      [userId]
    );
    return result.rows;
  }

  /**
   * Accept an invitation
   * @param {number} invitationId - Invitation ID
   * @param {number} userId - User ID (for security)
   * @returns {Promise<Object>} - Updated invitation and new membership
   */
  static async accept(invitationId, userId) {
    const client = await getClient();
    
    try {
      await client.query('BEGIN');
      
      // Update invitation status
      const invitationResult = await client.query(
        `UPDATE project_invitations 
         SET status = 'accepted', responded_at = CURRENT_TIMESTAMP 
         WHERE id = $1 AND invitee_id = $2 AND status = 'pending'
         RETURNING *`,
        [invitationId, userId]
      );
      
      if (invitationResult.rows.length === 0) {
        throw new Error('Invitation not found or already processed');
      }
      
      const invitation = invitationResult.rows[0];
      
      // Add user to project members
      await client.query(
        'INSERT INTO project_members (project_id, user_id, role) VALUES ($1, $2, $3)',
        [invitation.project_id, invitation.invitee_id, invitation.role]
      );
      
      // Log activity
      await client.query(
        'INSERT INTO activity_logs (project_id, user_id, activity_type, details) VALUES ($1, $2, $3, $4)',
        [invitation.project_id, invitation.invitee_id, 'MEMBER_JOINED', { 
          user_id: invitation.invitee_id,
          role: invitation.role 
        }]
      );
      
      await client.query('COMMIT');
      return invitation;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Decline an invitation
   * @param {number} invitationId - Invitation ID
   * @param {number} userId - User ID (for security)
   * @returns {Promise<Object>} - Updated invitation
   */
  static async decline(invitationId, userId) {
    const result = await query(
      `UPDATE project_invitations 
       SET status = 'declined', responded_at = CURRENT_TIMESTAMP 
       WHERE id = $1 AND invitee_id = $2 AND status = 'pending'
       RETURNING *`,
      [invitationId, userId]
    );
    
    if (result.rows.length === 0) {
      throw new Error('Invitation not found or already processed');
    }
    
    return result.rows[0];
  }

  /**
   * Check if invitation exists
   * @param {number} projectId - Project ID
   * @param {number} userId - User ID
   * @returns {Promise<Object|null>} - Existing invitation or null
   */
  static async getByProjectAndUser(projectId, userId) {
    const result = await query(
      'SELECT * FROM project_invitations WHERE project_id = $1 AND invitee_id = $2',
      [projectId, userId]
    );
    return result.rows[0] || null;
  }
}

module.exports = ProjectInvitationModel;
