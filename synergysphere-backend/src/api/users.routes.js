const express = require('express');
const router = express.Router();
const UserController = require('../controllers/user.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

// All user routes require authentication
router.use(authenticateToken);

// User search and management
router.get('/search', UserController.searchUsers);
router.get('/check-username/:username', UserController.checkUsername);
router.get('/projects', UserController.getUserProjects);
router.get('/:id', UserController.getUserById);

module.exports = router;
