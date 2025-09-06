const { verifyToken } = require('../utils/security');
const { query } = require('../config/db');

/**
 * Socket.IO service for real-time communication
 */
class SocketService {
  constructor(io) {
    this.io = io;
    this.connectedUsers = new Map(); // userId -> socketId
    this.userSockets = new Map(); // socketId -> userId
    this.setupSocketHandlers();
  }

  setupSocketHandlers() {
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        if (!token) {
          return next(new Error('Authentication token required'));
        }

        const decoded = verifyToken(token);
        
        // Verify user exists
        const userResult = await query(
          'SELECT id, username, full_name FROM users WHERE id = $1',
          [decoded.userId]
        );

        if (userResult.rows.length === 0) {
          return next(new Error('User not found'));
        }

        socket.userId = decoded.userId;
        socket.user = userResult.rows[0];
        next();
      } catch (error) {
        next(new Error('Invalid token'));
      }
    });

    this.io.on('connection', (socket) => {
      console.log(`User ${socket.user.username} connected with socket ${socket.id}`);
      
      // Store user connection
      this.connectedUsers.set(socket.userId, socket.id);
      this.userSockets.set(socket.id, socket.userId);

      // Join user's personal room for notifications and direct messages
      socket.join(`user_${socket.userId}`);

      // Join project rooms based on user's projects
      this.joinUserProjects(socket);

      // Handle joining specific project room
      socket.on('join_project', async (projectId) => {
        await this.handleJoinProject(socket, projectId);
      });

      // Handle leaving project room
      socket.on('leave_project', (projectId) => {
        socket.leave(`project_${projectId}`);
      });

      // Handle direct message
      socket.on('send_message', async (data) => {
        await this.handleDirectMessage(socket, data);
      });

      // Handle typing indicators for direct messages
      socket.on('typing_start', (data) => {
        this.handleTypingStart(socket, data);
      });

      socket.on('typing_stop', (data) => {
        this.handleTypingStop(socket, data);
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        console.log(`User ${socket.user.username} disconnected`);
        this.connectedUsers.delete(socket.userId);
        this.userSockets.delete(socket.id);
      });
    });
  }

  /**
   * Join user to all their project rooms
   */
  async joinUserProjects(socket) {
    try {
      const projectsResult = await query(
        'SELECT project_id FROM project_members WHERE user_id = $1',
        [socket.userId]
      );

      for (const project of projectsResult.rows) {
        socket.join(`project_${project.project_id}`);
      }
    } catch (error) {
      console.error('Error joining user projects:', error);
    }
  }

  /**
   * Handle joining a specific project room
   */
  async handleJoinProject(socket, projectId) {
    try {
      // Verify user is a member of the project
      const memberResult = await query(
        'SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2',
        [projectId, socket.userId]
      );

      if (memberResult.rows.length > 0) {
        socket.join(`project_${projectId}`);
        socket.emit('joined_project', { projectId });
      } else {
        socket.emit('error', { message: 'Not a project member' });
      }
    } catch (error) {
      console.error('Error joining project:', error);
      socket.emit('error', { message: 'Failed to join project' });
    }
  }

  /**
   * Handle direct message
   */
  async handleDirectMessage(socket, data) {
    try {
      const { recipientId, content } = data;

      if (!recipientId || !content) {
        socket.emit('error', { message: 'Recipient ID and content are required' });
        return;
      }

      // Save message to database
      const messageResult = await query(
        'INSERT INTO direct_messages (sender_id, recipient_id, content) VALUES ($1, $2, $3) RETURNING *',
        [socket.userId, recipientId, content]
      );

      const message = messageResult.rows[0];

      // Get sender info
      const messageWithSender = {
        ...message,
        sender_username: socket.user.username,
        sender_name: socket.user.full_name
      };

      // Send to recipient if they're online
      this.io.to(`user_${recipientId}`).emit('new_message', messageWithSender);
      
      // Send confirmation to sender
      socket.emit('message_sent', messageWithSender);

    } catch (error) {
      console.error('Error handling direct message:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  }

  /**
   * Handle typing indicators
   */
  handleTypingStart(socket, data) {
    const { recipientId } = data;
    if (recipientId) {
      this.io.to(`user_${recipientId}`).emit('user_typing', {
        userId: socket.userId,
        username: socket.user.username
      });
    }
  }

  handleTypingStop(socket, data) {
    const { recipientId } = data;
    if (recipientId) {
      this.io.to(`user_${recipientId}`).emit('user_stopped_typing', {
        userId: socket.userId,
        username: socket.user.username
      });
    }
  }

  /**
   * Emit project activity to all project members
   */
  emitProjectActivity(projectId, activity) {
    this.io.to(`project_${projectId}`).emit('project_activity', activity);
  }

  /**
   * Emit task update to project members
   */
  emitTaskUpdate(projectId, task, updateType = 'updated') {
    this.io.to(`project_${projectId}`).emit('task_update', {
      type: updateType,
      task
    });
  }

  /**
   * Emit comment to project members
   */
  emitNewComment(projectId, comment) {
    this.io.to(`project_${projectId}`).emit('new_comment', comment);
  }

  /**
   * Send notification to specific user
   */
  async sendNotification(userId, notification) {
    try {
      // Save notification to database
      const notificationResult = await query(
        'INSERT INTO notifications (user_id, type, content, link_to) VALUES ($1, $2, $3, $4) RETURNING *',
        [userId, notification.type, notification.content, notification.link_to || null]
      );

      const savedNotification = notificationResult.rows[0];

      // Send to user if they're online
      this.io.to(`user_${userId}`).emit('new_notification', savedNotification);

      return savedNotification;
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }

  /**
   * Broadcast to all project members
   */
  broadcastToProject(projectId, event, data) {
    this.io.to(`project_${projectId}`).emit(event, data);
  }

  /**
   * Send to specific user
   */
  sendToUser(userId, event, data) {
    this.io.to(`user_${userId}`).emit(event, data);
  }

  /**
   * Get online users count
   */
  getOnlineUsersCount() {
    return this.connectedUsers.size;
  }

  /**
   * Check if user is online
   */
  isUserOnline(userId) {
    return this.connectedUsers.has(userId);
  }

  /**
   * Get online users in project
   */
  async getOnlineProjectMembers(projectId) {
    try {
      const membersResult = await query(
        'SELECT user_id FROM project_members WHERE project_id = $1',
        [projectId]
      );

      const onlineMembers = [];
      for (const member of membersResult.rows) {
        if (this.isUserOnline(member.user_id)) {
          const userResult = await query(
            'SELECT id, username, full_name FROM users WHERE id = $1',
            [member.user_id]
          );
          if (userResult.rows.length > 0) {
            onlineMembers.push(userResult.rows[0]);
          }
        }
      }

      return onlineMembers;
    } catch (error) {
      console.error('Error getting online project members:', error);
      return [];
    }
  }
}

module.exports = SocketService;
