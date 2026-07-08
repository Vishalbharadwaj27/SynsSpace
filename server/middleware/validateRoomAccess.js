const pool = require('../config/database');

const validateRoomAccess = async (req, res, next) => {
  try {
    const { roomId } = req.params;
    const userId = req.userId;

    const [members] = await pool.query(
      'SELECT * FROM room_members WHERE room_id = ? AND user_id = ?',
      [roomId, userId]
    );

    if (members.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this room'
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error validating room access'
    });
  }
};

module.exports = { validateRoomAccess };
