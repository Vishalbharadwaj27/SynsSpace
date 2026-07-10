const fs = require('fs');
const path = require('path');
const pool = require('../config/database');

// Get all workspaces (rooms) across the platform
const getAllWorkspaces = async (req, res) => {
  try {
    const [workspaces] = await pool.query(
      `SELECT sr.*, u.full_name as creator_name, 
       (SELECT COUNT(*) FROM room_members WHERE room_id = sr.id) as member_count
       FROM study_rooms sr
       JOIN users u ON sr.creator_id = u.id
       ORDER BY sr.created_at DESC`
    );

    res.status(200).json({
      success: true,
      data: { workspaces }
    });
  } catch (error) {
    console.error('Global admin get all workspaces error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching workspace directory'
    });
  }
};

// Get detailed information of any specific workspace
const getWorkspaceDetails = async (req, res) => {
  try {
    const { roomId } = req.params;

    // Get workspace metadata
    const [rooms] = await pool.query('SELECT * FROM study_rooms WHERE id = ?', [roomId]);
    if (rooms.length === 0) {
      return res.status(404).json({ success: false, message: 'Workspace not found' });
    }

    // Get workspace stats
    const [[{ totalMembers }]] = await pool.query('SELECT COUNT(*) as totalMembers FROM room_members WHERE room_id = ?', [roomId]);
    const [[{ totalTasks }]] = await pool.query('SELECT COUNT(*) as totalTasks FROM tasks WHERE room_id = ?', [roomId]);
    const [[{ totalNotes }]] = await pool.query('SELECT COUNT(*) as totalNotes FROM notes WHERE room_id = ?', [roomId]);
    const [[{ totalFiles }]] = await pool.query('SELECT COUNT(*) as totalFiles FROM files WHERE room_id = ?', [roomId]);
    const [[{ totalMessages }]] = await pool.query('SELECT COUNT(*) as totalMessages FROM messages WHERE room_id = ?', [roomId]);

    // Get members
    const [members] = await pool.query(
      `SELECT rm.user_id, rm.role, rm.joined_at, u.full_name, u.email, u.profile_photo 
       FROM room_members rm
       JOIN users u ON rm.user_id = u.id
       WHERE rm.room_id = ?
       ORDER BY rm.joined_at ASC`,
      [roomId]
    );

    // Get messages (limit to 20 for moderation overview)
    const [messages] = await pool.query(
      `SELECT m.*, u.full_name, u.profile_photo 
       FROM messages m 
       JOIN users u ON m.user_id = u.id 
       WHERE m.room_id = ? 
       ORDER BY m.created_at DESC LIMIT 20`,
      [roomId]
    );

    // Get files
    const [files] = await pool.query(
      `SELECT f.*, u.full_name as uploader_name
       FROM files f
       JOIN users u ON f.uploaded_by = u.id
       WHERE f.room_id = ?
       ORDER BY f.created_at DESC`,
      [roomId]
    );

    res.status(200).json({
      success: true,
      data: {
        workspace: rooms[0],
        stats: { totalMembers, totalTasks, totalNotes, totalFiles, totalMessages },
        members,
        messages: messages.reverse(),
        files
      }
    });
  } catch (error) {
    console.error('Global admin get workspace details error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching workspace details'
    });
  }
};

// Update member role in workspace
const updateMemberRole = async (req, res) => {
  try {
    const { roomId, userId } = req.params;
    const { role: newRole } = req.body;

    if (!['owner', 'admin', 'member'].includes(newRole)) {
      return res.status(400).json({ success: false, message: 'Invalid role.' });
    }

    await pool.query(
      'UPDATE room_members SET role = ? WHERE room_id = ? AND user_id = ?',
      [newRole, roomId, userId]
    );

    res.status(200).json({
      success: true,
      message: 'Member role updated successfully by Global Admin'
    });
  } catch (error) {
    console.error('Global admin update member role error:', error);
    res.status(500).json({ success: false, message: 'Error updating member role' });
  }
};

// Remove member from workspace
const removeMember = async (req, res) => {
  try {
    const { roomId, userId } = req.params;

    await pool.query(
      'DELETE FROM room_members WHERE room_id = ? AND user_id = ?',
      [roomId, userId]
    );

    res.status(200).json({
      success: true,
      message: 'Member removed from workspace by Global Admin'
    });
  } catch (error) {
    console.error('Global admin remove member error:', error);
    res.status(500).json({ success: false, message: 'Error removing member' });
  }
};

// Delete message
const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;

    const [messages] = await pool.query('SELECT room_id FROM messages WHERE id = ?', [messageId]);
    if (messages.length === 0) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    const roomId = messages[0].room_id;

    await pool.query('DELETE FROM messages WHERE id = ?', [messageId]);

    // Emit realtime deletion event
    const io = req.app.get('io');
    io.to(roomId).emit('message_deleted', { messageId });

    res.status(200).json({ success: true, message: 'Message deleted by Global Admin' });
  } catch (error) {
    console.error('Global admin delete message error:', error);
    res.status(500).json({ success: false, message: 'Error deleting message' });
  }
};

// Delete file
const deleteFile = async (req, res) => {
  try {
    const { fileId } = req.params;

    const [files] = await pool.query('SELECT file_path FROM files WHERE id = ?', [fileId]);
    if (files.length === 0) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }

    const file = files[0];
    const filePath = path.resolve(file.file_path);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await pool.query('DELETE FROM files WHERE id = ?', [fileId]);

    res.status(200).json({ success: true, message: 'File deleted by Global Admin' });
  } catch (error) {
    console.error('Global admin delete file error:', error);
    res.status(500).json({ success: false, message: 'Error deleting file' });
  }
};

module.exports = {
  getAllWorkspaces,
  getWorkspaceDetails,
  updateMemberRole,
  removeMember,
  deleteMessage,
  deleteFile
};
