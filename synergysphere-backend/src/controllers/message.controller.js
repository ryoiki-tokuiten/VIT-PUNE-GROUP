const { query, getClient } = require('../config/db');

/**
 * Message controller for direct messaging
 */
class MessageController {
  /**
   * Send a direct message
   */
  static async sendMessage(req, res) {
    try {
      const { recipient_id, content } = req.body;

      if (!recipient_id || isNaN(recipient_id)) {
        return res.status(400).json({
          success: false,
          message: 'Valid recipient ID is required'
        });
      }

      if (!content || content.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Message content is required'
        });
      }

      if (content.length > 1000) {
        return res.status(400).json({
          success: false,
          message: 'Message cannot exceed 1000 characters'
        });
      }

      // Check if recipient exists
      const recipientResult = await query('SELECT id FROM users WHERE id = $1', [recipient_id]);
      if (recipientResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Recipient not found'
        });
      }

      // Can't send message to self
      if (parseInt(recipient_id) === req.user.id) {
        return res.status(400).json({
          success: false,
          message: 'Cannot send message to yourself'
        });
      }

      // Create message
      const messageResult = await query(
        'INSERT INTO direct_messages (sender_id, recipient_id, content) VALUES ($1, $2, $3) RETURNING *',
        [req.user.id, parseInt(recipient_id), content.trim()]
      );

      const message = messageResult.rows[0];

      res.status(201).json({
        success: true,
        message: 'Message sent successfully',
        data: { message }
      });
    } catch (error) {
      console.error('Send message error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get conversation with another user
   */
  static async getConversation(req, res) {
    try {
      const { userId } = req.params;
      const { limit = 50, offset = 0 } = req.query;

      if (!userId || isNaN(userId)) {
        return res.status(400).json({
          success: false,
          message: 'Valid user ID is required'
        });
      }

      const otherUserId = parseInt(userId);

      // Get messages between current user and other user
      const messagesResult = await query(`
        SELECT 
          dm.*,
          s.username as sender_username,
          s.full_name as sender_name,
          r.username as recipient_username,
          r.full_name as recipient_name
        FROM direct_messages dm
        JOIN users s ON dm.sender_id = s.id
        JOIN users r ON dm.recipient_id = r.id
        WHERE 
          (dm.sender_id = $1 AND dm.recipient_id = $2) OR 
          (dm.sender_id = $2 AND dm.recipient_id = $1)
        ORDER BY dm.created_at DESC
        LIMIT $3 OFFSET $4
      `, [req.user.id, otherUserId, parseInt(limit), parseInt(offset)]);

      // Mark messages as read where current user is recipient
      await query(
        'UPDATE direct_messages SET is_read = TRUE WHERE recipient_id = $1 AND sender_id = $2 AND is_read = FALSE',
        [req.user.id, otherUserId]
      );

      res.json({
        success: true,
        data: { 
          messages: messagesResult.rows.reverse(), // Reverse to show oldest first
          pagination: {
            limit: parseInt(limit),
            offset: parseInt(offset),
            has_more: messagesResult.rows.length === parseInt(limit)
          }
        }
      });
    } catch (error) {
      console.error('Get conversation error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get list of conversations for current user
   */
  static async getConversations(req, res) {
    try {
      const conversationsResult = await query(`
        WITH latest_messages AS (
          SELECT 
            CASE 
              WHEN sender_id = $1 THEN recipient_id 
              ELSE sender_id 
            END as other_user_id,
            MAX(created_at) as last_message_time,
            COUNT(*) FILTER (WHERE recipient_id = $1 AND is_read = FALSE) as unread_count
          FROM direct_messages 
          WHERE sender_id = $1 OR recipient_id = $1
          GROUP BY other_user_id
        ),
        latest_message_content AS (
          SELECT DISTINCT ON (
            CASE 
              WHEN sender_id = $1 THEN recipient_id 
              ELSE sender_id 
            END
          )
            CASE 
              WHEN sender_id = $1 THEN recipient_id 
              ELSE sender_id 
            END as other_user_id,
            content,
            sender_id,
            created_at
          FROM direct_messages 
          WHERE sender_id = $1 OR recipient_id = $1
          ORDER BY 
            CASE 
              WHEN sender_id = $1 THEN recipient_id 
              ELSE sender_id 
            END,
            created_at DESC
        )
        SELECT 
          u.id,
          u.username,
          u.full_name,
          lm.last_message_time,
          lm.unread_count,
          lmc.content as last_message_content,
          lmc.sender_id as last_message_sender_id
        FROM latest_messages lm
        JOIN users u ON lm.other_user_id = u.id
        JOIN latest_message_content lmc ON lm.other_user_id = lmc.other_user_id
        ORDER BY lm.last_message_time DESC
      `, [req.user.id]);

      res.json({
        success: true,
        data: { conversations: conversationsResult.rows }
      });
    } catch (error) {
      console.error('Get conversations error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get unread message count
   */
  static async getUnreadCount(req, res) {
    try {
      const countResult = await query(
        'SELECT COUNT(*) as unread_count FROM direct_messages WHERE recipient_id = $1 AND is_read = FALSE',
        [req.user.id]
      );

      res.json({
        success: true,
        data: { unread_count: parseInt(countResult.rows[0].unread_count) }
      });
    } catch (error) {
      console.error('Get unread count error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Mark conversation as read
   */
  static async markAsRead(req, res) {
    try {
      const { userId } = req.params;

      if (!userId || isNaN(userId)) {
        return res.status(400).json({
          success: false,
          message: 'Valid user ID is required'
        });
      }

      await query(
        'UPDATE direct_messages SET is_read = TRUE WHERE recipient_id = $1 AND sender_id = $2',
        [req.user.id, parseInt(userId)]
      );

      res.json({
        success: true,
        message: 'Messages marked as read'
      });
    } catch (error) {
      console.error('Mark as read error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get notifications for user
   */
  static async getNotifications(req, res) {
    try {
      const { limit = 20, offset = 0 } = req.query;

      const notificationsResult = await query(`
        SELECT * FROM notifications 
        WHERE user_id = $1 
        ORDER BY created_at DESC 
        LIMIT $2 OFFSET $3
      `, [req.user.id, parseInt(limit), parseInt(offset)]);

      res.json({
        success: true,
        data: { 
          notifications: notificationsResult.rows,
          pagination: {
            limit: parseInt(limit),
            offset: parseInt(offset),
            has_more: notificationsResult.rows.length === parseInt(limit)
          }
        }
      });
    } catch (error) {
      console.error('Get notifications error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Mark notification as read
   */
  static async markNotificationRead(req, res) {
    try {
      const { id } = req.params;

      if (!id || isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'Valid notification ID is required'
        });
      }

      const result = await query(
        'UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2',
        [parseInt(id), req.user.id]
      );

      if (result.rowCount === 0) {
        return res.status(404).json({
          success: false,
          message: 'Notification not found'
        });
      }

      res.json({
        success: true,
        message: 'Notification marked as read'
      });
    } catch (error) {
      console.error('Mark notification read error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
}

module.exports = MessageController;
