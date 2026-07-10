const fs = require('fs');
const path = require('path');
const pool = require('../config/database');

// Get stats for a specific workspace (room)
const getStats = async (req, res) => {
  try {
    const { roomId } = req.params;

    const [[{ totalMembers }]] = await pool.query(
      'SELECT COUNT(*) as totalMembers FROM room_members WHERE room_id = ?',
      [roomId]
    );

    const [[{ totalTasks }]] = await pool.query(
      'SELECT COUNT(*) as totalTasks FROM tasks WHERE room_id = ?',
      [roomId]
    );

    const [[{ totalNotes }]] = await pool.query(
      'SELECT COUNT(*) as totalNotes FROM notes WHERE room_id = ?',
      [roomId]
    );

    const [[{ totalFiles }]] = await pool.query(
      'SELECT COUNT(*) as totalFiles FROM files WHERE room_id = ?',
      [roomId]
    );

    const [[{ totalMessages }]] = await pool.query(
      'SELECT COUNT(*) as totalMessages FROM messages WHERE room_id = ?',
      [roomId]
    );

    res.status(200).json({
      success: true,
      data: {
        totalMembers,
        totalTasks,
        totalNotes,
        totalFiles,
        totalMessages
      }
    });
  } catch (error) {
    console.error('Admin get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching workspace statistics'
    });
  }
};

// Get members list for a specific workspace (room)
const getMembers = async (req, res) => {
  try {
    const { roomId } = req.params;

    const [members] = await pool.query(
      `SELECT rm.user_id, rm.role, rm.joined_at, u.full_name, u.email, u.profile_photo 
       FROM room_members rm
       JOIN users u ON rm.user_id = u.id
       WHERE rm.room_id = ?
       ORDER BY rm.joined_at ASC`,
      [roomId]
    );

    res.status(200).json({
      success: true,
      data: { members }
    });
  } catch (error) {
    console.error('Admin get members error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching workspace members'
    });
  }
};

// Update member role in workspace
const updateMemberRole = async (req, res) => {
  try {
    const { roomId, userId: targetUserId } = req.params;
    const { role: newRole } = req.body;
    const callerId = req.userId;

    if (!['admin', 'member'].includes(newRole)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Role must be admin or member.'
      });
    }

    if (parseInt(targetUserId) === parseInt(callerId)) {
      return res.status(400).json({
        success: false,
        message: 'You cannot change your own role.'
      });
    }

    // Get caller role
    const [callers] = await pool.query(
      'SELECT role FROM room_members WHERE room_id = ? AND user_id = ?',
      [roomId, callerId]
    );
    const callerRole = callers[0]?.role;

    // Get target role
    const [targets] = await pool.query(
      'SELECT role FROM room_members WHERE room_id = ? AND user_id = ?',
      [roomId, targetUserId]
    );

    if (targets.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Member not found in this workspace.'
      });
    }

    const targetRole = targets[0].role;

    // Hierarchy check:
    if (targetRole === 'owner') {
      return res.status(403).json({
        success: false,
        message: 'Cannot change the role of the workspace owner.'
      });
    }

    if (callerRole === 'admin' && targetRole === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admins cannot change the role of other admins.'
      });
    }

    await pool.query(
      'UPDATE room_members SET role = ? WHERE room_id = ? AND user_id = ?',
      [newRole, roomId, targetUserId]
    );

    res.status(200).json({
      success: true,
      message: 'Member role updated successfully',
      data: { userId: targetUserId, role: newRole }
    });
  } catch (error) {
    console.error('Admin update role error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating member role'
    });
  }
};

// Remove member from workspace
const removeMember = async (req, res) => {
  try {
    const { roomId, userId: targetUserId } = req.params;
    const callerId = req.userId;

    if (parseInt(targetUserId) === parseInt(callerId)) {
      return res.status(400).json({
        success: false,
        message: 'You cannot remove yourself from the workspace.'
      });
    }

    // Get caller role
    const [callers] = await pool.query(
      'SELECT role FROM room_members WHERE room_id = ? AND user_id = ?',
      [roomId, callerId]
    );
    const callerRole = callers[0]?.role;

    // Get target role
    const [targets] = await pool.query(
      'SELECT role FROM room_members WHERE room_id = ? AND user_id = ?',
      [roomId, targetUserId]
    );

    if (targets.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Member not found in this workspace.'
      });
    }

    const targetRole = targets[0].role;

    // Hierarchy check:
    if (targetRole === 'owner') {
      return res.status(403).json({
        success: false,
        message: 'Cannot remove the workspace owner.'
      });
    }

    if (callerRole === 'admin' && targetRole === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admins cannot remove other admins.'
      });
    }

    await pool.query(
      'DELETE FROM room_members WHERE room_id = ? AND user_id = ?',
      [roomId, targetUserId]
    );

    res.status(200).json({
      success: true,
      message: 'Member removed from workspace successfully'
    });
  } catch (error) {
    console.error('Admin remove member error:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing member'
    });
  }
};

// Delete message (moderation)
const deleteMessage = async (req, res) => {
  try {
    const { roomId, messageId } = req.params;

    // Verify message exists in this room
    const [messages] = await pool.query(
      'SELECT * FROM messages WHERE id = ? AND room_id = ?',
      [messageId, roomId]
    );

    if (messages.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Message not found in this workspace.'
      });
    }

    await pool.query('DELETE FROM messages WHERE id = ?', [messageId]);

    // Send realtime event
    const io = req.app.get('io');
    io.to(roomId).emit('message_deleted', { messageId });

    res.status(200).json({
      success: true,
      message: 'Message deleted successfully'
    });
  } catch (error) {
    console.error('Admin delete message error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting message'
    });
  }
};

// Delete file (moderation)
const deleteFile = async (req, res) => {
  try {
    const { roomId, fileId } = req.params;

    // Verify file exists in this room
    const [files] = await pool.query(
      'SELECT * FROM files WHERE id = ? AND room_id = ?',
      [fileId, roomId]
    );

    if (files.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'File not found in this workspace.'
      });
    }

    const file = files[0];
    const filePath = path.resolve(file.file_path);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await pool.query('DELETE FROM files WHERE id = ?', [fileId]);

    res.status(200).json({
      success: true,
      message: 'File deleted successfully'
    });
  } catch (error) {
    console.error('Admin delete file error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting file'
    });
  }
};

module.exports = {
  getStats,
  getMembers,
  updateMemberRole,
  removeMember,
  deleteMessage,
  deleteFile
};
