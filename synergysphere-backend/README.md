# SynergySphere Backend API

A comprehensive collaboration platform backend built with Node.js, Express, PostgreSQL, and Socket.IO.

## Features

- **Authentication & Authorization**: JWT-based authentication with secure password hashing
- **Project Management**: Create, manage, and collaborate on projects with role-based access
- **Task Management**: Full CRUD operations for tasks with assignments and status tracking
- **Real-time Communication**: Socket.IO powered real-time messaging and activity feeds
- **File Management**: Secure file upload and management system
- **Direct Messaging**: Private messaging between users
- **Notifications**: Real-time notifications for project activities
- **Activity Logging**: Comprehensive activity tracking for projects and tasks

## Technology Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL
- **Real-time**: Socket.IO
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcryptjs
- **File Uploads**: Multer
- **Security**: Helmet, CORS, Rate Limiting

## Prerequisites

- Node.js (v16.0.0 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd synergysphere-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   Copy `.env` file and update the values:
   ```bash
   # Database Configuration
   DATABASE_URL=postgresql://username:password@localhost:5432/synergysphere_db

   # Server Configuration
   PORT=5000
   NODE_ENV=development

   # Security
   JWT_SECRET=your_super_secure_jwt_secret_key_here
   JWT_EXPIRE=7d

   # File Upload Configuration
   UPLOAD_DIR=uploads
   MAX_FILE_SIZE=10485760

   # CORS Configuration
   FRONTEND_URL=http://localhost:5173

   # Rate Limiting
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=100
   ```

4. **Set up PostgreSQL database**
   Create a PostgreSQL database and update the `DATABASE_URL` in your `.env` file.

5. **Initialize database schema**
   ```bash
   npm run init-db
   ```

6. **Start the server**
   ```bash
   # Development mode with auto-restart
   npm run dev

   # Production mode
   npm start
   ```

## API Documentation

Once the server is running, visit:
- **API Documentation**: `http://localhost:5000/api`
- **Health Check**: `http://localhost:5000/api/health`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile (protected)
- `PUT /api/auth/profile` - Update user profile (protected)
- `GET /api/auth/verify` - Verify JWT token (protected)

### Users
- `GET /api/users/search` - Search users by username (protected)
- `GET /api/users/projects` - Get user projects (protected)
- `GET /api/users/:id` - Get user by ID (protected)

### Projects
- `POST /api/projects` - Create new project (protected)
- `GET /api/projects/:id` - Get project details (protected)
- `PUT /api/projects/:id` - Update project (protected, admin)
- `DELETE /api/projects/:id` - Delete project (protected, admin)
- `GET /api/projects/:projectId/members` - Get project members (protected)
- `POST /api/projects/:projectId/members` - Add project member (protected, admin)

### Tasks
- `GET /api/tasks/mytasks` - Get user assigned tasks (protected)
- `GET /api/tasks/:id` - Get task details (protected)
- `PUT /api/tasks/:id` - Update task (protected)
- `DELETE /api/tasks/:id` - Delete task (protected)
- `POST /api/tasks/:id/comments` - Add comment to task (protected)

### Messages
- `POST /api/messages` - Send direct message (protected)
- `GET /api/messages/conversations` - Get user conversations (protected)
- `GET /api/messages/notifications` - Get user notifications (protected)

## Real-time Features

The application uses Socket.IO for real-time communication:

### Client Events (Send to server)
- `join_project` - Join project room for updates
- `leave_project` - Leave project room
- `send_message` - Send direct message
- `typing_start` - Start typing indicator
- `typing_stop` - Stop typing indicator

### Server Events (Receive from server)
- `new_message` - New direct message received
- `new_notification` - New notification received
- `project_activity` - Project activity update
- `task_update` - Task update notification
- `new_comment` - New comment on task
- `user_typing` - User started typing
- `user_stopped_typing` - User stopped typing

## Database Schema

The application uses a normalized PostgreSQL schema with the following main tables:

- **users** - User accounts and profiles
- **projects** - Project information
- **project_members** - Project membership with roles
- **tasks** - Task management
- **task_assignees** - Task assignments
- **comments** - Comments on tasks and projects
- **attachments** - File attachments
- **activity_logs** - Activity tracking
- **direct_messages** - Private messaging
- **notifications** - User notifications

## Security Features

- **JWT Authentication** - Secure token-based authentication
- **Password Hashing** - bcrypt with salt rounds
- **Rate Limiting** - Prevent API abuse
- **CORS Protection** - Configurable cross-origin policies
- **Helmet Security** - Security headers
- **Input Validation** - Comprehensive input sanitization
- **Role-based Access** - Project-level permission system

## File Upload

The application supports secure file uploads with:
- **Size limits** - 10MB default maximum
- **Type validation** - Allowed file types only
- **Secure storage** - Files stored outside web root
- **Access control** - Authentication required for access

## Development

### Scripts
- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm run init-db` - Initialize database schema

### Project Structure
```
synergysphere-backend/
├── .env                  # Environment variables
├── package.json
├── server.js             # Main server entry point
└── src/
    ├── api/              # API routes
    ├── config/           # Database connection
    ├── controllers/      # Business logic
    ├── middleware/       # Custom middleware
    ├── models/           # Data access logic
    ├── services/         # Real-time services
    ├── scripts/          # Database initialization
    └── utils/            # Utility functions
```


## License

MIT License - see LICENSE file for details