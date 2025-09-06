const NotificationModel = require('../models/notification.model');
const ProjectInvitationModel = require('../models/projectInvitation.model');

/**
 * Notification controller
 */
class NotificationController {
  /**
   * Get notifications for the authenticated user
   */
  static async getNotifications(req, res) {
    try {
      const { page = 1, limit = 20 } = req.query;
      const offset = (page - 1) * limit;

      const notifications = await NotificationModel.getByUserId(
        req.user.id, 
        parseInt(limit), 
        parseInt(offset)
      );

      const unreadCount = await NotificationModel.getUnreadCount(req.user.id);

      res.json({
        success: true,
        data: {
          notifications,
          unreadCount,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            hasMore: notifications.length === parseInt(limit)
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
  static async markAsRead(req, res) {
    try {
      const { id } = req.params;

      const notification = await NotificationModel.markAsRead(parseInt(id), req.user.id);

      if (!notification) {
        return res.status(404).json({
          success: false,
          message: 'Notification not found'
        });
      }

      res.json({
        success: true,
        data: { notification }
      });
    } catch (error) {
      console.error('Mark notification as read error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Mark all notifications as read
   */
  static async markAllAsRead(req, res) {
    try {
      const updatedCount = await NotificationModel.markAllAsRead(req.user.id);

      res.json({
        success: true,
        message: `${updatedCount} notifications marked as read`,
        data: { updatedCount }
      });
    } catch (error) {
      console.error('Mark all notifications as read error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Accept project invitation
   */
  static async acceptInvitation(req, res) {
    try {
      const { invitationId } = req.params;

      const invitation = await ProjectInvitationModel.accept(parseInt(invitationId), req.user.id);

      res.json({
        success: true,
        message: 'Invitation accepted successfully',
        data: { invitation }
      });
    } catch (error) {
      console.error('Accept invitation error:', error);
      
      if (error.message === 'Invitation not found or already processed') {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Decline project invitation
   */
  static async declineInvitation(req, res) {
    try {
      const { invitationId } = req.params;

      const invitation = await ProjectInvitationModel.decline(parseInt(invitationId), req.user.id);

      res.json({
        success: true,
        message: 'Invitation declined',
        data: { invitation }
      });
    } catch (error) {
      console.error('Decline invitation error:', error);
      
      if (error.message === 'Invitation not found or already processed') {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
}

module.exports = NotificationController;
