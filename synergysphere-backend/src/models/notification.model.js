const { query, getClient } = require('../config/db');

/**
 * Notification model for database operations
 */
class NotificationModel {
  /**
   * Create a new notification
   * @param {Object} notificationData - Notification data
   * @returns {Promise<Object>} - Created notification
   */
  static async create({ user_id, type, title, message, data = null }) {
    // Combine title and message into content for the existing table structure
    const content = title ? `${title}: ${message}` : message;
    
    const result = await query(
      'INSERT INTO notifications (user_id, type, content, link_to) VALUES ($1, $2, $3, $4) RETURNING *',
      [user_id, type, content, data ? JSON.stringify(data) : null]
    );
    return result.rows[0];
  }

  /**
   * Get notifications for a user
   * @param {number} userId - User ID
   * @param {number} limit - Limit of notifications to fetch
   * @param {number} offset - Offset for pagination
   * @returns {Promise<Array>} - User notifications
   */
  static async getByUserId(userId, limit = 20, offset = 0) {
    const result = await query(
      `SELECT id, user_id, type, content as message, link_to as data, is_read, created_at 
       FROM notifications 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );
    
    // Parse the JSON data and add title for compatibility
    return result.rows.map(row => ({
      ...row,
      title: row.type === 'PROJECT_INVITATION' ? 'Project Invitation' : 'Notification',
      data: row.data ? JSON.parse(row.data) : null
    }));
  }

  /**
   * Get unread notifications count for a user
   * @param {number} userId - User ID
   * @returns {Promise<number>} - Unread notifications count
   */
  static async getUnreadCount(userId) {
    const result = await query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = FALSE',
      [userId]
    );
    return parseInt(result.rows[0].count);
  }

  /**
   * Mark notification as read
   * @param {number} notificationId - Notification ID
   * @returns {Promise<Object>} - Updated notification
   */
  static async markAsRead(notificationId) {
    const result = await query(
      'UPDATE notifications SET is_read = TRUE WHERE id = $1 RETURNING id, user_id, type, content as message, link_to as data, is_read, created_at',
      [notificationId]
    );
    
    if (result.rows[0]) {
      return {
        ...result.rows[0],
        title: result.rows[0].type === 'PROJECT_INVITATION' ? 'Project Invitation' : 'Notification',
        data: result.rows[0].data ? JSON.parse(result.rows[0].data) : null
      };
    }
    return null;
  }

  /**
   * Mark all notifications as read for a user
   * @param {number} userId - User ID
   * @returns {Promise<number>} - Number of updated notifications
   */
  static async markAllAsRead(userId) {
    const result = await query(
      'UPDATE notifications SET is_read = TRUE WHERE user_id = $1 AND is_read = FALSE',
      [userId]
    );
    return result.rowCount;
  }

  /**
   * Delete a notification
   * @param {number} notificationId - Notification ID
   * @param {number} userId - User ID (for security)
   * @returns {Promise<boolean>} - Success status
   */
  static async delete(notificationId, userId) {
    const result = await query(
      'DELETE FROM notifications WHERE id = $1 AND user_id = $2',
      [notificationId, userId]
    );
    return result.rowCount > 0;
  }
}

module.exports = NotificationModel;
