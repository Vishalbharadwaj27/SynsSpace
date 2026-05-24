const pool = require('../config/database');

const createNote = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { title, content } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'Note title is required'
      });
    }

    const [result] = await pool.query(
      'INSERT INTO notes (room_id, title, content, created_by) VALUES (?, ?, ?, ?)',
      [roomId, title, content || '', req.userId]
    );

    const [notes] = await pool.query(
      `SELECT n.*, u.full_name as creator_name, u.profile_photo as creator_photo
       FROM notes n
       JOIN users u ON n.created_by = u.id
       WHERE n.id = ?`,
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: 'Note created successfully',
      data: { note: notes[0] }
    });
  } catch (error) {
    console.error('Create note error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating note'
    });
  }
};

const getNotes = async (req, res) => {
  try {
    const { roomId } = req.params;

    const [notes] = await pool.query(
      `SELECT n.*, u.full_name as creator_name, u.profile_photo as creator_photo
       FROM notes n
       JOIN users u ON n.created_by = u.id
       WHERE n.room_id = ?
       ORDER BY n.updated_at DESC`,
      [roomId]
    );

    res.status(200).json({
      success: true,
      data: { notes }
    });
  } catch (error) {
    console.error('Get notes error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching notes'
    });
  }
};

const getNoteById = async (req, res) => {
  try {
    const { noteId } = req.params;

    const [notes] = await pool.query(
      `SELECT n.*, u.full_name as creator_name, u.profile_photo as creator_photo
       FROM notes n
       JOIN users u ON n.created_by = u.id
       WHERE n.id = ?`,
      [noteId]
    );

    if (notes.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Note not found'
      });
    }

    res.status(200).json({
      success: true,
      data: { note: notes[0] }
    });
  } catch (error) {
    console.error('Get note error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching note'
    });
  }
};

const updateNote = async (req, res) => {
  try {
    const { noteId } = req.params;
    const { title, content } = req.body;

    await pool.query(
      'UPDATE notes SET title = ?, content = ?, last_edited_by = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [title, content, req.userId, noteId]
    );

    const [notes] = await pool.query(
      `SELECT n.*, u.full_name as creator_name, u.profile_photo as creator_photo
       FROM notes n
       JOIN users u ON n.created_by = u.id
       WHERE n.id = ?`,
      [noteId]
    );

    res.status(200).json({
      success: true,
      message: 'Note updated successfully',
      data: { note: notes[0] }
    });
  } catch (error) {
    console.error('Update note error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating note'
    });
  }
};

const deleteNote = async (req, res) => {
  try {
    const { noteId } = req.params;

    await pool.query('DELETE FROM notes WHERE id = ?', [noteId]);

    res.status(200).json({
      success: true,
      message: 'Note deleted successfully'
    });
  } catch (error) {
    console.error('Delete note error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting note'
    });
  }
};

module.exports = {
  createNote,
  getNotes,
  getNoteById,
  updateNote,
  deleteNote
};
