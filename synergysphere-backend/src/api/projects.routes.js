const express = require('express');
const router = express.Router();
const ProjectController = require('../controllers/project.controller');
const TaskController = require('../controllers/task.controller');
const AttachmentController = require('../controllers/attachment.controller');
const { authenticateToken, checkProjectMember, checkProjectAdmin } = require('../middleware/auth.middleware');
const { uploadMultiple } = require('../middleware/fileUpload.middleware');

// All project routes require authentication
router.use(authenticateToken);

// Project CRUD
router.post('/', ProjectController.createProject);
router.get('/:id', checkProjectMember, ProjectController.getProject);
router.put('/:id', checkProjectAdmin, ProjectController.updateProject);
router.delete('/:id', checkProjectAdmin, ProjectController.deleteProject);

// Project members management
router.get('/:projectId/members', checkProjectMember, ProjectController.getProjectMembers);
router.post('/:projectId/members', checkProjectAdmin, ProjectController.addProjectMember);
router.put('/:projectId/members/:userId/role', checkProjectAdmin, ProjectController.updateMemberRole);
router.delete('/:projectId/members/:userId', checkProjectAdmin, ProjectController.removeMember);

// Project activity
router.get('/:projectId/activity', checkProjectMember, ProjectController.getProjectActivity);

// Tasks within projects
router.post('/:projectId/tasks', checkProjectMember, TaskController.createTask);
router.get('/:projectId/tasks', checkProjectMember, TaskController.getProjectTasks);

module.exports = router;
