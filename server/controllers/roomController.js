const pool = require('../config/database');

const createRoom = async (req, res) => {
  try {
    const { name, description, is_private, max_members } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Room name is required'
      });
    }

    const room_code = Math.random().toString(36).substring(2, 8).toUpperCase();

    const [result] = await pool.query(
      'INSERT INTO study_rooms (name, description, creator_id, is_private, room_code, max_members) VALUES (?, ?, ?, ?, ?, ?)',
      [name, description || null, req.userId, is_private || false, is_private ? room_code : null, max_members || 50]
    );

    await pool.query(
      'INSERT INTO room_members (room_id, user_id, role) VALUES (?, ?, ?)',
      [result.insertId, req.userId, 'owner']
    );

    const [rooms] = await pool.query(
      'SELECT * FROM study_rooms WHERE id = ?',
      [result.insertId]
    );
    rooms[0].room_code = room_code;

    res.status(201).json({
      success: true,
      message: 'Room created successfully',
      data: { room: rooms[0] }
    });
  } catch (error) {
    console.error('Create room error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating room'
    });
  }
};

const getRooms = async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT sr.*, u.full_name as creator_name, 
      (SELECT COUNT(*) FROM room_members WHERE room_id = sr.id) as member_count
      FROM study_rooms sr
      JOIN users u ON sr.creator_id = u.id
      WHERE sr.is_private = false
    `;
    const params = [];

    if (search) {
      query += ' AND sr.name LIKE ?';
      params.push(`%${search}%`);
    }

    query += ' ORDER BY sr.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const [rooms] = await pool.query(query, params);

    const [countResult] = await pool.query(
      'SELECT COUNT(*) as total FROM study_rooms WHERE is_private = false'
    );

    res.status(200).json({
      success: true,
      data: {
        rooms,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: countResult[0].total,
          totalPages: Math.ceil(countResult[0].total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get rooms error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching rooms'
    });
  }
};

const getRoomById = async (req, res) => {
  try {
    const { roomId } = req.params;

    const [rooms] = await pool.query(
      'SELECT * FROM study_rooms WHERE id = ?',
      [roomId]
    );

    if (rooms.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    const [members] = await pool.query(
      `SELECT rm.*, u.full_name, u.email, u.profile_photo 
       FROM room_members rm 
       JOIN users u ON rm.user_id = u.id 
       WHERE rm.room_id = ?`,
      [roomId]
    );

    res.status(200).json({
      success: true,
      data: {
        room: rooms[0],
        members
      }
    });
  } catch (error) {
    console.error('Get room error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching room'
    });
  }
};

const joinRoom = async (req, res) => {
  try {
    const { room_code } = req.body;

    if (!room_code) {
      return res.status(400).json({
        success: false,
        message: 'Room code is required'
      });
    }

    const [rooms] = await pool.query(
      'SELECT * FROM study_rooms WHERE room_code = ?',
      [room_code]
    );

    if (rooms.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Invalid room code'
      });
    }

    const room = rooms[0];

    const [existingMembers] = await pool.query(
      'SELECT * FROM room_members WHERE room_id = ? AND user_id = ?',
      [room.id, req.userId]
    );

    if (existingMembers.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Already a member of this room'
      });
    }

    const [memberCount] = await pool.query(
      'SELECT COUNT(*) as count FROM room_members WHERE room_id = ?',
      [room.id]
    );

    if (memberCount[0].count >= room.max_members) {
      return res.status(400).json({
        success: false,
        message: 'Room is full'
      });
    }

    await pool.query(
      'INSERT INTO room_members (room_id, user_id, role) VALUES (?, ?, ?)',
      [room.id, req.userId, 'member']
    );

    res.status(200).json({
      success: true,
      message: 'Joined room successfully',
      data: { room }
    });
  } catch (error) {
    console.error('Join room error:', error);
    res.status(500).json({
      success: false,
      message: 'Error joining room'
    });
  }
};

const getUserRooms = async (req, res) => {
  try {
    const [rooms] = await pool.query(
      `SELECT sr.*, rm.role as user_role,
       (SELECT COUNT(*) FROM room_members WHERE room_id = sr.id) as member_count
       FROM study_rooms sr
       JOIN room_members rm ON sr.id = rm.room_id
       WHERE rm.user_id = ?
       ORDER BY sr.created_at DESC`,
      [req.userId]
    );

    res.status(200).json({
      success: true,
      data: { rooms }
    });
  } catch (error) {
    console.error('Get user rooms error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user rooms'
    });
  }
};

const leaveRoom = async (req, res) => {
  try {
    const { roomId } = req.params;

    const [members] = await pool.query(
      'SELECT * FROM room_members WHERE room_id = ? AND user_id = ?',
      [roomId, req.userId]
    );

    if (members.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Not a member of this room'
      });
    }

    if (members[0].role === 'owner') {
      return res.status(400).json({
        success: false,
        message: 'Owner cannot leave room. Transfer ownership first.'
      });
    }

    await pool.query(
      'DELETE FROM room_members WHERE room_id = ? AND user_id = ?',
      [roomId, req.userId]
    );

    res.status(200).json({
      success: true,
      message: 'Left room successfully'
    });
  } catch (error) {
    console.error('Leave room error:', error);
    res.status(500).json({
      success: false,
      message: 'Error leaving room'
    });
  }
};

module.exports = {
  createRoom,
  getRooms,
  getRoomById,
  joinRoom,
  getUserRooms,
  leaveRoom
};
