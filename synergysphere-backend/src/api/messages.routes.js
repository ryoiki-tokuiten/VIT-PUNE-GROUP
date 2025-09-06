const express = require('express');
const router = express.Router();
const MessageController = require('../controllers/message.controller');
const AttachmentController = require('../controllers/attachment.controller');
const { authenticateToken } = require('../middleware/auth.middleware');
const { uploadMultiple } = require('../middleware/fileUpload.middleware');

// All message routes require authentication
router.use(authenticateToken);

// Direct messaging
router.post('/', MessageController.sendMessage);
router.get('/conversations', MessageController.getConversations);
router.get('/unread-count', MessageController.getUnreadCount);
router.get('/conversation/:userId', MessageController.getConversation);
router.put('/conversation/:userId/read', MessageController.markAsRead);

// Notifications
router.get('/notifications', MessageController.getNotifications);
router.put('/notifications/:id/read', MessageController.markNotificationRead);

module.exports = router;
