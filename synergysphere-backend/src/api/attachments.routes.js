const express = require('express');
const router = express.Router();
const AttachmentController = require('../controllers/attachment.controller');
const { authenticateToken } = require('../middleware/auth.middleware');
const { uploadMultiple } = require('../middleware/fileUpload.middleware');

// All attachment routes require authentication
router.use(authenticateToken);

// Attachment management
router.get('/:id', AttachmentController.getAttachment);
router.get('/:id/download', AttachmentController.downloadAttachment);
router.delete('/:id', AttachmentController.deleteAttachment);

// Comment attachments
router.post('/comments/:commentId', uploadMultiple('files', 3), AttachmentController.uploadCommentFiles);

module.exports = router;
