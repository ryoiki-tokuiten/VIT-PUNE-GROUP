# SynergySphere: Detailed Implementation Plan

## Guiding Principles

1.  **NEVER Hardcode Values:** All configuration settings, secrets, and keys (e.g., database credentials, JWT secrets, server ports) must be managed through environment variables (`.env` file).
2.  **Robust Database Design:** The database schema will be normalized and structured to ensure data integrity, scalability, and efficient querying from the start. We will use raw SQL queries via the `pg` library, ensuring every query is secure and optimized.
3.  **Scalable Architecture:** The backend and frontend will be developed as separate services with a clear API contract. This decoupling allows for independent scaling and development.
4.  **Clean Code & Structure:** Both backend and frontend projects will follow a strict, logical directory and file structure. Code will be modular, commented where necessary, and adhere to consistent style guides.
5.  **Security First:** All user input will be validated and sanitized. Passwords will be hashed using a strong algorithm (bcrypt). Authorization will be enforced on every protected API endpoint.

---

## Stage 1: Backend & Database Setup

This stage focuses on building the core engine of SynergySphere. The goal is a secure, stable, and feature-complete API that the frontend can consume.

### 1.1. Technology Stack

*   **Runtime:** Node.js
*   **Framework:** Express.js (for routing and middleware)
*   **Database:** PostgreSQL
*   **Database Driver:** `pg` (node-postgres) for direct SQL interaction.
*   **Authentication:** JSON Web Tokens (JWT) using the `jsonwebtoken` library.
*   **Password Hashing:** `bcrypt.js`
*   **File Uploads:** `multer` for handling multipart/form-data (local storage).
*   **Real-time Communication:** `socket.io` for activity feeds, comments, and direct messaging.
*   **Environment Variables:** `dotenv`

### 1.2. Backend Project Structure

```
synergysphere-backend/
├── .env                  # Environment variables
├── package.json
├── server.js             # Main server entry point
└── src/
    ├── api/              # API routes
    │   ├── auth.routes.js
    │   ├── projects.routes.js
    │   ├── tasks.routes.js
    │   ├── users.routes.js
    │   └── messages.routes.js
    ├── config/           # Database connection, etc.
    │   └── db.js
    ├── controllers/      # Business logic for routes
    │   ├── auth.controller.js
    │   ├── project.controller.js
    │   ├── task.controller.js
    │   ├── user.controller.js
    │   └── message.controller.js
    ├── middleware/       # Custom middleware
    │   ├── auth.middleware.js      # Verify JWT
    │   └── fileUpload.middleware.js # Configure Multer
    ├── models/           # Data access logic (SQL queries)
    │   ├── user.model.js
    │   ├── project.model.js
    │   └── task.model.js
    ├── services/         # Real-time services
    │   └── socket.js     # Socket.IO setup and event handling
    └── utils/            # Utility functions
        └── security.js   # Password hashing helpers
```

### 1.3. Database Schema (PostgreSQL)

We will create the following tables to represent the application's data structure. All `id` columns will be `SERIAL PRIMARY KEY` or `UUID`. Timestamps (`created_at`, `updated_at`) will be used extensively.

*   **`users`**
    *   `id`: SERIAL PRIMARY KEY
    *   `username`: VARCHAR(255) UNIQUE NOT NULL
    *   `full_name`: VARCHAR(255) NOT NULL
    *   `password_hash`: VARCHAR(255) NOT NULL
    *   `created_at`: TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP

*   **`projects`**
    *   `id`: SERIAL PRIMARY KEY
    *   `name`: VARCHAR(255) NOT NULL
    *   `description`: TEXT
    *   `creator_id`: INTEGER REFERENCES `users`(`id`)
    *   `created_at`: TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP

*   **`project_members`** (Junction table for many-to-many relationship between users and projects)
    *   `project_id`: INTEGER REFERENCES `projects`(`id`) ON DELETE CASCADE
    *   `user_id`: INTEGER REFERENCES `users`(`id`) ON DELETE CASCADE
    *   `role`: VARCHAR(50) NOT NULL DEFAULT 'Member' -- e.g., 'Owner', 'Admin', 'Member'
    *   PRIMARY KEY (`project_id`, `user_id`)

*   **`tasks`**
    *   `id`: SERIAL PRIMARY KEY
    *   `project_id`: INTEGER REFERENCES `projects`(`id`) ON DELETE CASCADE
    *   `title`: VARCHAR(255) NOT NULL
    *   `description`: TEXT
    *   `status`: VARCHAR(50) NOT NULL DEFAULT 'Pending' -- e.g., 'Pending', 'In Progress', 'Completed'
    *   `due_date`: TIMESTAMP WITH TIME ZONE
    *   `creator_id`: INTEGER REFERENCES `users`(`id`)
    *   `created_at`: TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP

*   **`task_assignees`** (Junction table for many-to-many relationship between tasks and users)
    *   `task_id`: INTEGER REFERENCES `tasks`(`id`) ON DELETE CASCADE
    *   `user_id`: INTEGER REFERENCES `users`(`id`) ON DELETE CASCADE
    *   PRIMARY KEY (`task_id`, `user_id`)

*   **`comments`**
    *   `id`: SERIAL PRIMARY KEY
    *   `content`: TEXT NOT NULL
    *   `user_id`: INTEGER REFERENCES `users`(`id`)
    *   `task_id`: INTEGER REFERENCES `tasks`(`id`) ON DELETE CASCADE
    *   `project_id`: INTEGER REFERENCES `projects`(`id`) ON DELETE CASCADE -- For project-level comments
    *   `parent_comment_id`: INTEGER REFERENCES `comments`(`id`) -- For threaded replies
    *   `created_at`: TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    *   *Constraint: Either `task_id` or `project_id` must be non-null.*

*   **`attachments`**
    *   `id`: SERIAL PRIMARY KEY
    *   `file_name`: VARCHAR(255) NOT NULL
    *   `file_path`: VARCHAR(255) NOT NULL -- Path in the local file system
    *   `mime_type`: VARCHAR(100)
    *   `uploader_id`: INTEGER REFERENCES `users`(`id`)
    *   `task_id`: INTEGER REFERENCES `tasks`(`id`) ON DELETE CASCADE -- For task files
    *   `comment_id`: INTEGER REFERENCES `comments`(`id`) ON DELETE CASCADE -- For comment images
    *   `created_at`: TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP

*   **`activity_logs`**
    *   `id`: SERIAL PRIMARY KEY
    *   `project_id`: INTEGER REFERENCES `projects`(`id`) ON DELETE CASCADE
    *   `task_id`: INTEGER REFERENCES `tasks`(`id`) ON DELETE SET NULL
    *   `user_id`: INTEGER REFERENCES `users`(`id`)
    *   `activity_type`: VARCHAR(255) NOT NULL -- e.g., 'TASK_CREATED', 'STATUS_CHANGED', 'USER_ASSIGNED'
    *   `details`: JSONB -- e.g., `{ "from_status": "Pending", "to_status": "In Progress" }`
    *   `created_at`: TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP

*   **`direct_messages`**
    *   `id`: SERIAL PRIMARY KEY
    *   `sender_id`: INTEGER REFERENCES `users`(`id`)
    *   `recipient_id`: INTEGER REFERENCES `users`(`id`)
    *   `content`: TEXT NOT NULL
    *   `created_at`: TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    *   `is_read`: BOOLEAN DEFAULT FALSE

*   **`notifications`**
    *   `id`: SERIAL PRIMARY KEY
    *   `user_id`: INTEGER REFERENCES `users`(`id`) ON DELETE CASCADE -- The recipient
    *   `type`: VARCHAR(255) NOT NULL -- e.g., 'TASK_ASSIGNED', 'MENTIONED_IN_COMMENT'
    *   `content`: TEXT NOT NULL
    *   `link_to`: VARCHAR(255) -- e.g., `/projects/123/tasks/456`
    *   `is_read`: BOOLEAN DEFAULT FALSE
    *   `created_at`: TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP

### 1.4. Implementation Plan

1.  **Environment Setup:** Initialize Node.js project, install dependencies, set up `.env` file for `DATABASE_URL`, `JWT_SECRET`, `PORT`, etc.
2.  **Database Connection:** Create `src/config/db.js` to establish and export a connection pool to PostgreSQL using `pg`.
3.  **Authentication:**
    *   Implement `POST /api/auth/register` to create a new user, hashing the password with `bcrypt`.
    *   Implement `POST /api/auth/login` to verify credentials and return a JWT.
    *   Create `auth.middleware.js` to protect routes by verifying the JWT from the `Authorization` header.
4.  **User Endpoints:**
    *   Implement `GET /api/users/search?username=` to find users for task assignment and direct messaging.
5.  **Project Management:**
    *   Implement full CRUD endpoints for projects (`/api/projects`). Ensure only authorized users can perform actions.
    *   Implement endpoints for managing project members (`/api/projects/:projectId/members`), including adding users and setting roles.
6.  **Task Management:**
    *   Implement full CRUD endpoints for tasks within a project (`/api/projects/:projectId/tasks`).
    *   Handle assignment of multiple users to a task.
    *   Implement `GET /api/tasks/mytasks` to fetch all tasks assigned to the logged-in user across all projects.
7.  **File Uploads:**
    *   Configure `multer` in `fileUpload.middleware.js` for local storage in a designated `/uploads` directory.
    *   Create endpoints (`POST /api/tasks/:taskId/attachments`, `POST /api/comments/:commentId/attachments`) to handle file uploads and save metadata to the `attachments` table.
    *   Create a static route in Express to serve files from the `/uploads` directory securely.
8.  **Real-time Features (Socket.IO):**
    *   Integrate Socket.IO with the Express server.
    *   **Comments:** When a comment is posted via API, emit a socket event to the relevant "room" (e.g., a project or task room) so connected clients can update in real-time.
    *   **Activity Feed:** On key actions (task creation, status change), save to `activity_logs` and emit an event to the project room.
    *   **Direct Messaging:** Set up user-specific rooms for real-time chat. On receiving a message, emit an event to the recipient's room.
    *   **Notifications:** When a notification is generated, emit an event to the specific user's room.

---

## Stage 2: Frontend & UI

This stage focuses on building a responsive, clean, and intuitive user interface that consumes the backend API.

### 2.1. Technology Stack

*   **Framework:** React (using Vite for project setup)
*   **Language:** JavaScript (or TypeScript for enhanced type safety)
*   **Routing:** React Router (`react-router-dom`)
*   **State Management:** Redux Toolkit (for managing global state like auth, projects, tasks).
*   **UI Component Library:** Material-UI (MUI) or Ant Design (for a professional look and pre-built components like modals, date pickers, etc.).
*   **API Communication:** Axios (for making HTTP requests to the backend).
*   **Real-time Communication:** `socket.io-client`
*   **Styling:** CSS-in-JS (e.g., styled-components) or CSS Modules.

### 2.2. Frontend Project Structure

```
synergysphere-frontend/
├── package.json
├── index.html
└── src/
    ├── App.jsx             # Main component with routing
    ├── main.jsx            # Entry point
    ├── assets/             # Images, fonts, etc.
    ├── components/         # Reusable UI components
    │   ├── auth/           # Login, Signup forms
    │   ├── common/         # Buttons, Modals, Loaders
    │   ├── layout/         # Navbar, Sidebar
    │   ├── projects/       # ProjectList, ProjectCard
    │   └── tasks/          # TaskBoard, TaskCard, TaskForm
    ├── contexts/           # (Optional) React Context for simple state
    ├── hooks/              # Custom hooks (e.g., useAuth)
    ├── pages/              # Top-level page components
    │   ├── DashboardPage.jsx
    │   ├── LoginPage.jsx
    │   ├── ProjectDetailPage.jsx
    │   ├── MyTasksPage.jsx
    │   └── InboxPage.jsx
    ├── services/           # API communication layer
    │   ├── api.js          # Axios instance setup
    │   ├── auth.service.js
    │   ├── project.service.js
    │   └── task.service.js
    └── store/              # Redux Toolkit state management
        ├── store.js        # Redux store setup
        ├── features/       # Slices for different domains
        │   ├── authSlice.js
        │   ├── projectSlice.js
        │   └── taskSlice.js
```

### 2.3. Implementation Plan

1.  **Setup & Routing:**
    *   Initialize React project using Vite. Install dependencies.
    *   Set up React Router with protected routes that require authentication.
    *   Create the main `App.jsx` layout with a persistent Navbar/Sidebar and a content area for pages.
2.  **Authentication:**
    *   Build `LoginPage` and `SignUpPage`.
    *   Create an `authSlice` in Redux to manage user state and JWT.
    *   Upon successful login, store the JWT in `localStorage` and set the authorization header for all subsequent Axios requests.
3.  **Dashboard & Project Views:**
    *   **Dashboard (`DashboardPage`):** Fetch and display the list of projects the user belongs to. Include a "Create New Project" button that opens a modal/form.
    *   **My Tasks (`MyTasksPage`):** Fetch data from the `/api/tasks/mytasks` endpoint and display all tasks assigned to the user, grouped by project.
4.  **Project Detail View:**
    *   Create a dynamic route `/projects/:id`.
    *   This page will act as a "command center" with tabs or sections for:
        *   **Tasks:** A board view (To-Do, In Progress, Done) or a list view of all tasks. Implement drag-and-drop for status changes.
        *   **Activity:** A real-time feed of activities within the project, powered by Socket.IO.
        *   **Members:** A list of project members.
5.  **Task Management UI:**
    *   **Task Creation:** Build a `TaskForm` component (likely in a modal) with fields for title, description, multi-select for assignees, and a date picker.
    *   **Task Detail:** Clicking a task card opens a `TaskDetailModal` showing all information, attachments, and a real-time comments section.
    *   **File Handling:** Create a file upload component that allows users to select files, shows upload progress, and displays attached files with download links.
6.  **Real-time Integration:**
    *   Create a global `socket.js` service to establish and manage the Socket.IO connection.
    *   Use React's `useEffect` hook in relevant components to listen for socket events and update the Redux store or component state accordingly (e.g., a new comment appears without a page refresh).
7.  **Inbox & Notifications:**
    *   **Inbox (`InboxPage`):** Design a classic two-pane layout: a list of conversations on the left and the selected chat window on the right. Implement user search to start new conversations. Use Socket.IO for real-time message delivery.
    *   **Notifications:** Add a bell icon to the main navigation. When a notification event is received via Socket.IO, update a badge on the bell and add the notification to a dropdown list.
8.  **Responsiveness & UI Polish:**
    *   Ensure every component and page is mobile-friendly using responsive design principles (flexbox, grid, media queries).
    *   Prioritize a smooth user experience, especially for common actions on mobile (updating task status, sending a quick message).
    *   Add loading states and clear error feedback for all asynchronous operations.
