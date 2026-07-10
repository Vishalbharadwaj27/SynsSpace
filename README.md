# SyncSpace - Realtime Collaboration Platform for Students

A full-stack realtime collaboration platform where students can create study rooms, collaborate in real-time, chat, manage tasks, share notes, upload files, and use pomodoro timers to track productivity.

## Problem Statement

Modern student collaboration often happens across multiple disconnected tools—one platform for messaging, another for notes, a separate task manager, file sharing services, and productivity apps. This fragmented workflow increases context switching, reduces productivity, and makes it difficult for teams to stay organized.

Many existing collaboration platforms are also designed primarily for corporate environments and include unnecessary complexity for students and small project teams.

## Solution

SynsSpace solves this problem by providing a centralized collaborative workspace where teams can communicate, organize tasks, share files, maintain notes, and stay productive without leaving the application.

Instead of switching between multiple services, users can manage their complete project workflow from a single interface with real-time updates and collaborative features.

## Project Metrics

| Metric | Value |
| :--- | :--- |
| Architecture | Client–Server |
| Frontend | React |
| Backend | Node.js + Express |
| Database | MySQL |
| Authentication | JWT |
| Real-time Communication | Socket.IO |
| API Style | REST |
| Responsive Design | Yes |
| Modular Components | Yes |
| Protected Routes | Yes |

## Recruiter Highlights

- **Full-stack collaborative workspace** built from scratch.
- **Real-time communication** using Socket.IO.
- **JWT authentication** and protected APIs.
- **Modular Express backend** separating routing and business logic.
- **Responsive React frontend** with a production-ready folder structure.
- **Relational database design** with MySQL.
- **Designed with scalability and maintainability** in mind.

## Key Engineering Decisions

- **Modular Client-Server Architecture**: Kept frontend and backend independently scalable.
- **JWT Authentication**: Used for stateless user sessions.
- **Socket.IO**: Implemented for real-time communication instead of polling to reduce latency.
- **REST APIs**: Structured following REST principles for maintainability.
- **Feature-Based Frontend Organization**: Organized frontend components by feature instead of keeping everything in a single directory.
- **Separation of Concerns**: Separated business logic from routing to improve readability and future scalability.

## Architecture

```
                   Client (React)

                          │
                REST API + Socket.IO
                          │
             Express.js / Node.js Server
             │                     │
     Authentication          Real-time Events
             │                     │
             └──────────┬──────────┘
                        │
                     MySQL
```

### Why This Architecture?

The application separates presentation, business logic, and persistence into independent layers.

This makes the project easier to maintain, allows frontend and backend to evolve independently, and enables additional services such as notifications or analytics to be added with minimal changes.

## Trade-offs

### Chosen
- **MySQL** instead of MongoDB for structured relational data.
- **Socket.IO** instead of repeated HTTP polling for instant updates.
- **JWT** instead of server-side sessions for simpler deployment.
- **React Context** for global state where appropriate instead of introducing Redux unnecessarily.

### Future Trade-offs
As the application grows, Redis could be introduced for caching and Socket.IO scaling, and object storage such as AWS S3 or Cloudinary could replace local file storage.

## Performance Considerations
- Lazy loading of pages where possible.
- Optimized React component rendering.
- REST endpoints designed to avoid unnecessary payloads.
- Real-time updates eliminate repeated polling requests.
- Modular backend improves maintainability and reduces coupling.

## Security
- JWT-based authentication.
- Password hashing before database storage.
- Protected API routes.
- Input validation on client and server.
- Environment variables used for sensitive credentials.
- SQL injection prevention through parameterized queries.

## Scalability
The project has been structured so additional collaboration modules such as calendar scheduling, video meetings, AI assistance, or notifications can be integrated without significant architectural changes.

## Challenges Faced
- Managing synchronized real-time communication across multiple users.
- Designing reusable React components while keeping state manageable.
- Handling authentication across protected routes.
- Organizing backend modules to remain maintainable as features increased.
- Managing asynchronous Socket.IO events alongside REST APIs.

## What I Learned
Through this project I strengthened my understanding of:
- Full-stack application architecture
- React component design
- Authentication using JWT
- Real-time communication using Socket.IO
- REST API design
- Database modeling with MySQL
- State management
- Backend routing and middleware
- Project organization at production scale

## Future Improvements
- Email notifications
- Video conferencing
- Push notifications
- Calendar integration
- Activity analytics dashboard
- AI-powered meeting summaries
- Docker support
- Redis caching
- CI/CD pipeline
- Unit and integration testing
- **Role-Based Workspace Administration Extensions**:
  - Detailed activity & audit logs
  - Member invitation & pending requests management
  - Custom workspace settings & metadata customizations
  - Advanced content moderation queue & storage monitoring


---

## Technical Stack & Features

<details>
<summary><b>View Tech Stack Details</b></summary>

### Frontend
- React.js 18
- Ant Design 5
- Redux Toolkit
- React Router DOM
- Axios
- Socket.IO Client
- Recharts
- React Quill

### Backend
- Node.js
- Express.js
- Socket.IO
- MySQL
- JWT Authentication
- Multer (file uploads)
- Bcrypt (password hashing)
</details>

<details>
<summary><b>View Feature List (Grouped)</b></summary>

### Workspace & Communication
- **Study Rooms / Workspaces**: Create public/private rooms, browse/search rooms, join via code/card, manage members.
- **Realtime Chat**: Socket.IO powered messaging with typing indicators and auto-reconnection.
- **Notifications**: Real-time notifications for room activity and tasks.
- **Role-Based Workspace Administration**: Secure, workspace-isolated admin panel with an explicit permission hierarchy (Owner vs. Admin) to manage roles, remove members, and moderate files/messages.


### Productivity Tools
- **Task Management**: Kanban-style task board with status tracking.
- **Shared Notes**: Rich text notes with autosave.
- **Pomodoro Timer**: Shared study timer with session tracking and user stats.
- **Dashboard & Profile**: Overview of study hours, active tasks, room activity, and user stats.

### Infrastructure & Security
- **Secure File Sharing**: PDF and DOCX sharing (up to 8MB) with granular permissions ("View Only" vs "Downloadable") and server-side validation.
- **Authentication**: JWT-based flow (register, login, forgot/reset password).
</details>

<details>
<summary><b>View Project Directory Structure</b></summary>

```
SyncSpace/
├── client/                      # React Frontend (Redux Toolkit, Tailwind CSS, Ant Design)
│   ├── public/                  # Static assets
│   └── src/                     # React application source code
│       ├── layouts/             # App shell layouts (Main, Auth)
│       ├── pages/               # Screen components (Dashboard, Rooms, Profile, Auth)
│       ├── redux/               # State management (slices & store)
│       ├── styles/              # Styling configuration (Tailwind & standard styles)
│       └── utils/               # HTTP client (Axios) & Socket.io setup
└── server/                      # Node.js + Express Backend
    ├── config/                  # Database & authentication config
    ├── controllers/             # Business logic (Auth, Room, Task, Note, Pomodoro, Notification)
    ├── database/                # Schema definitions & initializer scripts
    ├── middleware/              # Auth guarding, access validation, error logging
    ├── routes/                  # REST API endpoint routes
    └── sockets/                 # Realtime event handlers (Socket.io)
```
</details>

<details>
<summary><b>View API Endpoints Reference</b></summary>

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update user profile
- `POST /api/auth/forgot-password` - Request password reset email
- `POST /api/auth/reset-password` - Reset password with token

### Rooms
- `GET /api/rooms` - Get all public rooms (supports `?search=` query)
- `POST /api/rooms` - Create a new room
- `GET /api/rooms/my-rooms` - Get user's joined rooms
- `POST /api/rooms/join` - Join a room by 6-character code
- `POST /api/rooms/:roomId/join` - Join a room by ID (requires `room_code` body for private rooms)
- `GET /api/rooms/:roomId` - Get room details
- `DELETE /api/rooms/:roomId` - Leave a room (transfers ownership if needed)

### Workspace Administration
- `GET /api/rooms/:roomId/admin/stats` - Get workspace metrics (members, tasks, notes, files, messages)
- `GET /api/rooms/:roomId/admin/members` - Get workspace members and their roles
- `PUT /api/rooms/:roomId/admin/members/:userId/role` - Update member's role (enforcing hierarchical permission check)
- `DELETE /api/rooms/:roomId/admin/members/:userId` - Remove a member from the workspace
- `DELETE /api/rooms/:roomId/admin/messages/:messageId` - Moderate/delete inappropriate message
- `DELETE /api/rooms/:roomId/admin/files/:fileId` - Moderate/delete file

### Global Platform Administration
- `GET /api/admin/workspaces` - Retrieve platform-wide directory of all workspaces
- `GET /api/admin/workspaces/:roomId` - Inspect statistics, members, and content for a workspace
- `PUT /api/admin/workspaces/:roomId/members/:userId/role` - Update any member's role in a workspace
- `DELETE /api/admin/workspaces/:roomId/members/:userId` - Kick any user from a workspace
- `DELETE /api/admin/messages/:messageId` - Delete any message across the platform
- `DELETE /api/admin/files/:fileId` - Delete any file across the platform



### Messages
- `GET /api/messages/:roomId` - Get room messages (paginated)
- `POST /api/messages/:roomId` - Send a message (broadcasts via Socket.IO)

### Tasks
- `GET /api/tasks/:roomId` - Get room tasks
- `POST /api/tasks/:roomId` - Create a task
- `PUT /api/tasks/:taskId` - Update a task
- `DELETE /api/tasks/:taskId` - Delete a task

### Notes
- `GET /api/notes/:roomId` - Get room notes
- `POST /api/notes/:roomId` - Create a note
- `GET /api/notes/note/:noteId` - Get note details
- `PUT /api/notes/:noteId` - Update a note
- `DELETE /api/notes/:noteId` - Delete a note

### Files
- `GET /api/files/:roomId` - Get room files
- `POST /api/files/:roomId` - Upload a file (restricted to PDF and DOCX, max 8MB, accepts optional `sharing_permission` parameter)
- `GET /api/files/download/:fileId` - Securely download file (restricted to downloadable files, uploader, or room owner/admins)
- `GET /api/files/view/:fileId` - Inline preview/view file (validates room access)
- `PUT /api/files/:fileId/permission` - Update file sharing permission (`view` or `download`)
- `DELETE /api/files/:fileId` - Delete a file (restricted to uploader or room owner/admins)

### Notifications
- `GET /api/notifications` - Get user notifications
- `PUT /api/notifications/:notificationId/read` - Mark as read
- `PUT /api/notifications/read-all` - Mark all as read

### Pomodoro
- `POST /api/pomodoro/:roomId/start` - Start a session
- `PUT /api/pomodoro/:sessionId/end` - End a session
- `GET /api/pomodoro/:roomId` - Get room sessions
- `GET /api/pomodoro/stats/user` - Get user stats
</details>

<details>
<summary><b>View Socket.IO Events Reference</b></summary>

### Client → Server
- `join_room` - Join a room socket room
- `leave_room` - Leave a room socket room
- `send_message` - Send a message
- `typing` - User is typing
- `stop_typing` - User stopped typing
- `task_update` - Task updated
- `note_update` - Note updated
- `pomodoro_start` - Pomodoro session started
- `pomodoro_end` - Pomodoro session ended

### Server → Client
- `receive_message` - New message received
- `user_joined` - User joined room
- `user_left` - User left room
- `user_typing` - User is typing
- `user_stop_typing` - User stopped typing
- `task_updated` - Task updated
- `note_updated` - Note updated
- `pomodoro_started` - Pomodoro session started
- `pomodoro_ended` - Pomodoro session ended
</details>

---

## Setup & Running Locally

### Prerequisites
- Node.js (v16 or higher)
- MySQL (v8.0 or higher)

### Quick Start

1. **Clone & Database Setup**:
   ```sql
   CREATE DATABASE syncspace;
   -- Import schema
   mysql -u root -p syncspace < server/database/schema.sql
   ```
2. **Backend Configuration**:
   Create `server/.env` (copy from `server/.env.example`):
   ```env
   PORT=5000
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_NAME=syncspace
   JWT_SECRET=your_jwt_secret_key
   CLIENT_URL=http://localhost:3000
   ```
3. **Frontend Configuration**:
   Create `client/.env` (copy from `client/.env.example`):
   ```env
   REACT_APP_API_URL=http://localhost:5000
   REACT_APP_SOCKET_URL=http://localhost:5000
   ```
4. **Install & Run**:
   ```bash
   # Terminal 1: Backend
   cd server && npm install && npm run dev

   # Terminal 2: Frontend
   cd client && npm install && npm start
   ```


#### Global Platform Admin
- **Email**: `admin@syncspace.com`
- **Password**: `admin123`

---

## License
MIT
