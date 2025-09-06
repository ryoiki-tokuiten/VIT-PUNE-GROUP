const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

// Import services and routes
const SocketService = require('./src/services/socket');

// Import API routes
const authRoutes = require('./src/api/auth.routes');
const userRoutes = require('./src/api/users.routes');
const projectRoutes = require('./src/api/projects.routes');
const taskRoutes = require('./src/api/tasks.routes');
const messageRoutes = require('./src/api/messages.routes');
const attachmentRoutes = require('./src/api/attachments.routes');

// Create Express app
const app = express();
const server = http.createServer(app);

// Configure Socket.IO with CORS
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Initialize Socket service
const socketService = new SocketService(io);

// Make socketService available globally for controllers
global.socketService = socketService;

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to API routes
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static file serving for uploads
app.use('/uploads', express.static(path.join(__dirname, process.env.UPLOAD_DIR || 'uploads')));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/attachments', attachmentRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'SynergySphere API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// API documentation endpoint
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'SynergySphere API',
    version: '1.0.0',
    endpoints: {
      auth: {
        'POST /api/auth/register': 'Register a new user',
        'POST /api/auth/login': 'Login user',
        'GET /api/auth/profile': 'Get user profile (protected)',
        'PUT /api/auth/profile': 'Update user profile (protected)',
        'GET /api/auth/verify': 'Verify JWT token (protected)'
      },
      users: {
        'GET /api/users/search': 'Search users by username (protected)',
        'GET /api/users/projects': 'Get user projects (protected)',
        'GET /api/users/:id': 'Get user by ID (protected)',
        'GET /api/users/check-username/:username': 'Check username availability (protected)'
      },
      projects: {
        'POST /api/projects': 'Create new project (protected)',
        'GET /api/projects/:id': 'Get project details (protected)',
        'PUT /api/projects/:id': 'Update project (protected, admin)',
        'DELETE /api/projects/:id': 'Delete project (protected, admin)',
        'GET /api/projects/:projectId/members': 'Get project members (protected)',
        'POST /api/projects/:projectId/members': 'Add project member (protected, admin)',
        'PUT /api/projects/:projectId/members/:userId/role': 'Update member role (protected, admin)',
        'DELETE /api/projects/:projectId/members/:userId': 'Remove member (protected, admin)',
        'GET /api/projects/:projectId/activity': 'Get project activity (protected)',
        'POST /api/projects/:projectId/tasks': 'Create task in project (protected)',
        'GET /api/projects/:projectId/tasks': 'Get project tasks (protected)'
      },
      tasks: {
        'GET /api/tasks/mytasks': 'Get user assigned tasks (protected)',
        'GET /api/tasks/:id': 'Get task details (protected)',
        'PUT /api/tasks/:id': 'Update task (protected)',
        'DELETE /api/tasks/:id': 'Delete task (protected)',
        'PUT /api/tasks/:id/assign': 'Assign users to task (protected)',
        'GET /api/tasks/:id/comments': 'Get task comments (protected)',
        'POST /api/tasks/:id/comments': 'Add comment to task (protected)',
        'GET /api/tasks/:taskId/attachments': 'Get task attachments (protected)',
        'POST /api/tasks/:taskId/attachments': 'Upload task attachments (protected)'
      },
      messages: {
        'POST /api/messages': 'Send direct message (protected)',
        'GET /api/messages/conversations': 'Get user conversations (protected)',
        'GET /api/messages/unread-count': 'Get unread message count (protected)',
        'GET /api/messages/conversation/:userId': 'Get conversation with user (protected)',
        'PUT /api/messages/conversation/:userId/read': 'Mark conversation as read (protected)',
        'GET /api/messages/notifications': 'Get user notifications (protected)',
        'PUT /api/messages/notifications/:id/read': 'Mark notification as read (protected)'
      },
      attachments: {
        'GET /api/attachments/:id': 'Get attachment file (protected)',
        'GET /api/attachments/:id/download': 'Download attachment (protected)',
        'DELETE /api/attachments/:id': 'Delete attachment (protected)',
        'POST /api/attachments/comments/:commentId': 'Upload comment attachments (protected)'
      }
    },
    realtime: {
      'Socket.IO Events': {
        'connection': 'Client connects with JWT token',
        'join_project': 'Join project room for real-time updates',
        'leave_project': 'Leave project room',
        'send_message': 'Send direct message',
        'typing_start': 'Start typing indicator',
        'typing_stop': 'Stop typing indicator',
        'new_message': 'Receive new direct message',
        'new_notification': 'Receive new notification',
        'project_activity': 'Receive project activity update',
        'task_update': 'Receive task update',
        'new_comment': 'Receive new comment',
        'user_typing': 'User started typing',
        'user_stopped_typing': 'User stopped typing'
      }
    }
  });
});

// Handle 404 for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
    path: req.path,
    method: req.method
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to SynergySphere API',
    version: '1.0.0',
    documentation: '/api',
    health: '/api/health'
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);
  
  // Handle multer errors
  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      message: 'File too large'
    });
  }
  
  if (error.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({
      success: false,
      message: 'Unexpected field name'
    });
  }

  // Handle JSON parsing errors
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    return res.status(400).json({
      success: false,
      message: 'Invalid JSON format'
    });
  }

  // Default error response
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: error.stack })
  });
});

// Handle 404 for all other routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.path,
    method: req.method
  });
});

// Start server
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════╗
║                    SynergySphere API                     ║
║                                                          ║
║  Server running on port ${PORT}                             ║
║  Environment: ${(process.env.NODE_ENV || 'development').padEnd(12)}                        ║
║  Socket.IO: Enabled                                      ║
║  Database: PostgreSQL                                    ║
║                                                          ║
║  Endpoints:                                              ║
║    • API Documentation: http://localhost:${PORT}/api        ║
║    • Health Check: http://localhost:${PORT}/api/health      ║
║                                                          ║
║  Real-time Features:                                     ║
║    • Direct Messaging                                    ║
║    • Project Activity Feeds                              ║
║    • Task Updates                                        ║
║    • Notifications                                       ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

module.exports = { app, server, io, socketService };
