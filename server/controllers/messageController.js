const pool = require('../config/database');

const sendMessage = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { content, message_type } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Message content is required'
      });
    }

    const [result] = await pool.query(
      'INSERT INTO messages (room_id, user_id, content, message_type) VALUES (?, ?, ?, ?)',
      [roomId, req.userId, content, message_type || 'text']
    );

    const [messages] = await pool.query(
      `SELECT m.*, u.full_name, u.profile_photo 
       FROM messages m 
       JOIN users u ON m.user_id = u.id 
       WHERE m.id = ?`,
      [result.insertId]
    );

    const io = req.app.get('io');
    io.to(roomId).emit('receive_message', messages[0]);

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: { message: messages[0] }
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending message'
    });
  }
};

const getMessages = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    const [messages] = await pool.query(
      `SELECT m.*, u.full_name, u.profile_photo 
       FROM messages m 
       JOIN users u ON m.user_id = u.id 
       WHERE m.room_id = ? 
       ORDER BY m.created_at DESC 
       LIMIT ? OFFSET ?`,
      [roomId, parseInt(limit), offset]
    );

    const [countResult] = await pool.query(
      'SELECT COUNT(*) as total FROM messages WHERE room_id = ?',
      [roomId]
    );

    res.status(200).json({
      success: true,
      data: {
        messages: messages.reverse(),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: countResult[0].total,
          totalPages: Math.ceil(countResult[0].total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching messages'
    });
  }
};

module.exports = {
  sendMessage,
  getMessages
};
