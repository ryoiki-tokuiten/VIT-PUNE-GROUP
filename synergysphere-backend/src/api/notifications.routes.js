const express = require('express');
const router = express.Router();
const NotificationController = require('../controllers/notification.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

// All notification routes require authentication
router.use(authenticateToken);

// Get notifications for authenticated user
router.get('/', NotificationController.getNotifications);

// Mark notification as read
router.put('/:id/read', NotificationController.markAsRead);

// Mark all notifications as read
router.put('/read-all', NotificationController.markAllAsRead);

// Accept project invitation
router.post('/invitations/:invitationId/accept', NotificationController.acceptInvitation);

// Decline project invitation
router.post('/invitations/:invitationId/decline', NotificationController.declineInvitation);

module.exports = router;
