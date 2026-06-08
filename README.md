# SyncSpace - Realtime Collaboration Platform for Students

A full-stack realtime collaboration platform where students can create study rooms, collaborate in real-time, chat, manage tasks, share notes, upload files, and use pomodoro timers to track productivity.

## Tech Stack

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

## Features

- **Authentication**: JWT-based register/login with forgot/reset password flow
- **Study Rooms**: Create public/private rooms, browse/search rooms, join via code or room card, manage members, leave rooms
- **Realtime Chat**: Socket.IO powered messaging with typing indicators and automatic reconnection
- **Task Management**: Kanban-style task board with status tracking
- **Shared Notes**: Rich text notes with autosave
- **File Sharing**: Securely share PDF and DOCX documents (up to 8MB) with granular access permissions ("View Only" vs. "Downloadable"), secure server-side checks, and an interactive file preview modal.
- **Pomodoro Timer**: Shared study timer with session tracking and user stats
- **Notifications**: Real-time notifications for room activity and tasks
- **User Profiles**: Customizable profiles with productivity stats
- **Dashboard**: Overview of study hours, active tasks, and room activity

## Project Structure

```
SyncSpace/
├── server/                      # Backend
│   ├── app.js                  # Main server file (Express + Socket.IO setup)
│   ├── package.json            # Backend dependencies
│   ├── .env.example            # Environment variables template
│   ├── config/
│   │   ├── database.js         # MySQL connection pool
│   │   └── jwt.js              # JWT configuration
│   ├── controllers/
│   │   ├── authController.js   # Register, login, profile, forgot/reset password
│   │   ├── roomController.js   # CRUD rooms, join by code, join by ID
│   │   ├── messageController.js# Send & fetch messages with socket broadcast
│   │   ├── taskController.js   # CRUD tasks
│   │   ├── noteController.js   # CRUD rich-text notes
│   │   ├── fileController.js   # Upload & manage files
│   │   ├── notificationController.js  # Notification CRUD
│   │   └── pomodoroController.js      # Pomodoro sessions & stats
│   ├── routes/
│   │   ├── auth.js
│   │   ├── rooms.js
│   │   ├── messages.js
│   │   ├── tasks.js
│   │   ├── notes.js
│   │   ├── files.js
│   │   ├── notifications.js
│   │   └── pomodoro.js
│   ├── middleware/
│   │   ├── auth.js             # JWT verification middleware
│   │   ├── errorHandler.js     # Global error handler
│   │   ├── logger.js           # Request logger (no-op by default)
│   │   └── validateRoomAccess.js  # Room membership check
│   ├── sockets/
│   │   └── socket.js           # Socket.IO event handlers
│   ├── database/
│   │   ├── schema.sql          # Database schema
│   │   └── initDb.js           # Database initializer (drops & recreates tables)
│   └── uploads/                # File upload directory
└── client/                     # Frontend
    ├── package.json            # Frontend dependencies
    ├── .env.example            # Environment variables template
    ├── public/
    │   └── index.html
    └── src/
        ├── index.js            # React entry point
        ├── App.js              # Main app component (routing + socket init)
        ├── pages/
        │   ├── auth/
        │   │   ├── Login.js
        │   │   ├── Register.js
        │   │   ├── ForgotPassword.js
        │   │   └── ResetPassword.js
        │   ├── Dashboard.js
        │   ├── Rooms.js
        │   ├── RoomDetail.js
        │   └── Profile.js
        ├── layouts/
        │   ├── MainLayout.js   # Authenticated layout with sidebar
        │   └── AuthLayout.js   # Public layout for auth pages
        ├── redux/
        │   ├── store.js        # Redux store configuration
        │   └── slices/
        │       ├── authSlice.js
        │       ├── roomSlice.js
        │       ├── messageSlice.js
        │       ├── taskSlice.js
        │       ├── noteSlice.js
        │       ├── notificationSlice.js
        │       └── pomodoroSlice.js
        ├── routes/
        │   └── ProtectedRoute.js  # Auth guard component
        ├── utils/
        │   ├── api.js          # Axios instance with 401 interceptor
        │   └── socket.js       # Socket.IO client singleton
        └── styles/
            └── index.css
```

## Prerequisites

- Node.js (v16 or higher)
- MySQL (v8.0 or higher)
- npm or yarn

## Installation

### 1. Clone the repository

```bash
cd SyncSpace
```

### 2. Set up the database

Create a MySQL database named `syncspace`:

```sql
CREATE DATABASE syncspace;
```

Run the database schema:

```bash
mysql -u root -p syncspace < server/database/schema.sql
```

Or manually execute the SQL commands in `server/database/schema.sql`.

### 3. Configure environment variables

#### Backend

Copy the example environment file:

```bash
cd server
cp .env.example .env
```

Edit `.env` with your configuration:

```env
PORT=5000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=syncspace
DB_PORT=3306

# JWT
JWT_SECRET=your_jwt_secret_key_change_this_in_production
JWT_EXPIRE=7d

# Client URL
CLIENT_URL=http://localhost:3000
```

#### Frontend

Copy the example environment file:

```bash
cd client
cp .env.example .env
```

Edit `.env` with your configuration:

```env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_SOCKET_URL=http://localhost:5000
```

### 4. Install dependencies

#### Backend

```bash
cd server
npm install
```

#### Frontend

```bash
cd client
npm install
```

## Running the Application

### Development Mode

#### Start the backend server:

```bash
cd server
npm run dev
```

The backend will run on `http://localhost:5000`

#### Start the frontend (in a new terminal):

```bash
cd client
npm start
```

The frontend will run on `http://localhost:3000`

### Production Mode

#### Backend:

```bash
cd server
npm start
```

#### Frontend:

```bash
cd client
npm run build
```

Then serve the `build` directory using a web server like nginx or serve:

```bash
npm install -g serve
serve -s build -l 3000
```

### Database Reset

To drop all tables and reinitialize the database:

```bash
cd server
node database/initDb.js
```

## API Endpoints

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

## Socket.IO Events

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

## Deployment

### Frontend (Vercel)

1. Push your code to GitHub
2. Import project in Vercel
3. Set environment variables in Vercel dashboard:
   - `REACT_APP_API_URL` (your backend URL)
   - `REACT_APP_SOCKET_URL` (your backend URL)
4. Deploy

### Backend (Railway)

1. Push your code to GitHub
2. Import project in Railway
3. Add a MySQL database service
4. Set environment variables:
   - `PORT` (default 5000)
   - `NODE_ENV` (production)
   - `DB_HOST` (Railway database host)
   - `DB_USER` (Railway database user)
   - `DB_PASSWORD` (Railway database password)
   - `DB_NAME` (Railway database name)
   - `DB_PORT` (Railway database port)
   - `JWT_SECRET` (generate a secure random string)
   - `JWT_EXPIRE` (7d)
   - `CLIENT_URL` (your Vercel frontend URL)
5. Deploy
6. Run the database schema on Railway MySQL

### MySQL (Railway)

1. Create a MySQL service in Railway
2. Get connection details from Railway dashboard
3. Run the schema.sql file on the database
4. Update backend environment variables with Railway database credentials

## Default Admin User

Email: `admin@syncspace.com`
Password: `admin123`

**Important**: Change the default admin password after first login in production.

## Security Considerations

- Change `JWT_SECRET` to a strong random string in production
- Use HTTPS in production
- Implement rate limiting for API endpoints
- Validate and sanitize all user inputs
- Use environment variables for sensitive data
- Regularly update dependencies
- Implement CORS properly
- Use secure file upload validation

## Troubleshooting

### Database Connection Issues

- Ensure MySQL is running
- Check database credentials in `.env`
- Verify database exists and schema is imported
- Check MySQL port (default 3306)

### Socket.IO Connection Issues

- Ensure backend is running
- Check `REACT_APP_SOCKET_URL` in frontend `.env`
- Verify CORS settings in backend
- Check firewall settings

### File Upload Issues

- Ensure `uploads` directory exists in server
- Check file size limits in Multer configuration
- Verify file type validation
- Check disk permissions

## License

MIT

## Support

For issues and questions, please open an issue on GitHub.
