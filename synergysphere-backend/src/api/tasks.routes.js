const express = require('express');
const router = express.Router();
const TaskController = require('../controllers/task.controller');
const AttachmentController = require('../controllers/attachment.controller');
const { authenticateToken, checkProjectMember } = require('../middleware/auth.middleware');
const { uploadMultiple } = require('../middleware/fileUpload.middleware');

// All task routes require authentication
router.use(authenticateToken);

// Task management
router.get('/mytasks', TaskController.getMyTasks);
router.get('/:id', TaskController.getTask);
router.put('/:id', TaskController.updateTask);
router.delete('/:id', TaskController.deleteTask);
router.put('/:id/assign', TaskController.assignUsers);

// Task comments
router.get('/:id/comments', TaskController.getTaskComments);
router.post('/:id/comments', TaskController.addComment);

// Task attachments
router.get('/:taskId/attachments', AttachmentController.getTaskAttachments);
router.post('/:taskId/attachments', uploadMultiple('files', 5), AttachmentController.uploadTaskFiles);

module.exports = router;
