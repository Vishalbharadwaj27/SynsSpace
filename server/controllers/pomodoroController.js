const pool = require('../config/database');

const startSession = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { duration_minutes, session_type } = req.body;

    if (!duration_minutes) {
      return res.status(400).json({
        success: false,
        message: 'Duration is required'
      });
    }

    const [result] = await pool.query(
      'INSERT INTO pomodoro_sessions (room_id, user_id, duration_minutes, session_type, started_at) VALUES (?, ?, ?, ?, NOW())',
      [roomId, req.userId, duration_minutes, session_type || 'work']
    );

    const [sessions] = await pool.query(
      `SELECT ps.*, u.full_name, u.profile_photo 
       FROM pomodoro_sessions ps
       JOIN users u ON ps.user_id = u.id
       WHERE ps.id = ?`,
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: 'Session started successfully',
      data: { session: sessions[0] }
    });
  } catch (error) {
    console.error('Start session error:', error);
    res.status(500).json({
      success: false,
      message: 'Error starting session'
    });
  }
};

const endSession = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const [sessions] = await pool.query(
      'SELECT * FROM pomodoro_sessions WHERE id = ? AND user_id = ?',
      [sessionId, req.userId]
    );

    if (sessions.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    const session = sessions[0];
    const durationHours = session.duration_minutes / 60;

    await pool.query(
      'UPDATE pomodoro_sessions SET ended_at = NOW(), completed = true WHERE id = ?',
      [sessionId]
    );

    await pool.query(
      'UPDATE users SET total_study_hours = total_study_hours + ? WHERE id = ?',
      [durationHours, req.userId]
    );

    res.status(200).json({
      success: true,
      message: 'Session ended successfully'
    });
  } catch (error) {
    console.error('End session error:', error);
    res.status(500).json({
      success: false,
      message: 'Error ending session'
    });
  }
};

const getSessions = async (req, res) => {
  try {
    const { roomId } = req.params;

    const [sessions] = await pool.query(
      `SELECT ps.*, u.full_name, u.profile_photo 
       FROM pomodoro_sessions ps
       JOIN users u ON ps.user_id = u.id
       WHERE ps.room_id = ?
       ORDER BY ps.started_at DESC
       LIMIT 50`,
      [roomId]
    );

    res.status(200).json({
      success: true,
      data: { sessions }
    });
  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching sessions'
    });
  }
};

const getUserStats = async (req, res) => {
  try {
    const [stats] = await pool.query(
      'SELECT total_study_hours FROM users WHERE id = ?',
      [req.userId]
    );

    const [sessionCount] = await pool.query(
      'SELECT COUNT(*) as count FROM pomodoro_sessions WHERE user_id = ? AND completed = true',
      [req.userId]
    );

    const [roomCount] = await pool.query(
      'SELECT COUNT(*) as count FROM room_members WHERE user_id = ?',
      [req.userId]
    );

    res.status(200).json({
      success: true,
      data: {
        totalStudyHours: stats[0]?.total_study_hours || 0,
        completedSessions: sessionCount[0]?.count || 0,
        roomsJoined: roomCount[0]?.count || 0
      }
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user stats'
    });
  }
};

module.exports = {
  startSession,
  endSession,
  getSessions,
  getUserStats
};
