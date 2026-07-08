const pool = require('../config/database');
const { createNotification } = require('../controllers/notificationController');

const onlineUsers = new Map();

const setupSocket = (io) => {
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join_room', async ({ roomId, userId }) => {
      socket.join(roomId);
      onlineUsers.set(userId, socket.id);

      const [members] = await pool.query(
        `SELECT u.id, u.full_name, u.profile_photo 
         FROM room_members rm
         JOIN users u ON rm.user_id = u.id
         WHERE rm.room_id = ?`,
        [roomId]
      );

      io.to(roomId).emit('user_joined', {
        userId,
        members: members.map(m => ({ ...m, online: onlineUsers.has(m.id) }))
      });
    });

    socket.on('leave_room', ({ roomId, userId }) => {
      socket.leave(roomId);
      onlineUsers.delete(userId);
      io.to(roomId).emit('user_left', { userId });
    });

    socket.on('send_message', async (data) => {
      const { roomId, userId, content, message_type } = data;

      try {
        const [result] = await pool.query(
          'INSERT INTO messages (room_id, user_id, content, message_type) VALUES (?, ?, ?, ?)',
          [roomId, userId, content, message_type || 'text']
        );

        const [messages] = await pool.query(
          `SELECT m.*, u.full_name, u.profile_photo 
           FROM messages m 
           JOIN users u ON m.user_id = u.id 
           WHERE m.id = ?`,
          [result.insertId]
        );

        io.to(roomId).emit('receive_message', messages[0]);
      } catch (error) {
        console.error('Socket message error:', error);
      }
    });

    socket.on('typing', ({ roomId, userId, userName }) => {
      socket.to(roomId).emit('user_typing', { userId, userName });
    });

    socket.on('stop_typing', ({ roomId, userId }) => {
      socket.to(roomId).emit('user_stop_typing', { userId });
    });

    socket.on('task_update', async ({ roomId, task }) => {
      io.to(roomId).emit('task_updated', task);
    });

    socket.on('note_update', async ({ roomId, note }) => {
      io.to(roomId).emit('note_updated', note);
    });

    socket.on('pomodoro_start', async ({ roomId, session }) => {
      io.to(roomId).emit('pomodoro_started', session);
    });

    socket.on('pomodoro_end', async ({ roomId, session }) => {
      io.to(roomId).emit('pomodoro_ended', session);
    });

    socket.on('disconnect', () => {
      for (const [userId, socketId] of onlineUsers.entries()) {
        if (socketId === socket.id) {
          onlineUsers.delete(userId);
          break;
        }
      }
      console.log('User disconnected:', socket.id);
    });
  });

  return onlineUsers;
};

module.exports = setupSocket;
