const pool = require('../config/database');

const createTask = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { title, description, assigned_to, priority, due_date } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'Task title is required'
      });
    }

    let formattedDueDate = null;
    if (due_date) {
      formattedDueDate = new Date(due_date).toISOString().slice(0, 19).replace('T', ' ');
    }

    const [result] = await pool.query(
      'INSERT INTO tasks (room_id, title, description, assigned_to, priority, due_date, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [roomId, title, description || null, assigned_to || null, priority || 'medium', formattedDueDate, req.userId]
    );

    const [tasks] = await pool.query(
      `SELECT t.*, u.full_name as assigned_name, u.profile_photo as assigned_photo,
       c.full_name as creator_name
       FROM tasks t
       LEFT JOIN users u ON t.assigned_to = u.id
       JOIN users c ON t.created_by = c.id
       WHERE t.id = ?`,
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: { task: tasks[0] }
    });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating task'
    });
  }
};

const getTasks = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { status } = req.query;

    let query = `
      SELECT t.*, u.full_name as assigned_name, u.profile_photo as assigned_photo,
      c.full_name as creator_name
      FROM tasks t
      LEFT JOIN users u ON t.assigned_to = u.id
      JOIN users c ON t.created_by = c.id
      WHERE t.room_id = ?
    `;
    const params = [roomId];

    if (status) {
      query += ' AND t.status = ?';
      params.push(status);
    }

    query += ' ORDER BY t.created_at DESC';

    const [tasks] = await pool.query(query, params);

    res.status(200).json({
      success: true,
      data: { tasks }
    });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching tasks'
    });
  }
};

const updateTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { title, description, assigned_to, status, priority, due_date } = req.body;

    let formattedDueDate = null;
    if (due_date) {
      formattedDueDate = new Date(due_date).toISOString().slice(0, 19).replace('T', ' ');
    }

    await pool.query(
      'UPDATE tasks SET title = ?, description = ?, assigned_to = ?, status = ?, priority = ?, due_date = ? WHERE id = ?',
      [title, description, assigned_to, status, priority, formattedDueDate, taskId]
    );

    const [tasks] = await pool.query(
      `SELECT t.*, u.full_name as assigned_name, u.profile_photo as assigned_photo,
       c.full_name as creator_name
       FROM tasks t
       LEFT JOIN users u ON t.assigned_to = u.id
       JOIN users c ON t.created_by = c.id
       WHERE t.id = ?`,
      [taskId]
    );

    res.status(200).json({
      success: true,
      message: 'Task updated successfully',
      data: { task: tasks[0] }
    });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating task'
    });
  }
};

const deleteTask = async (req, res) => {
  try {
    const { taskId } = req.params;

    await pool.query('DELETE FROM tasks WHERE id = ?', [taskId]);

    res.status(200).json({
      success: true,
      message: 'Task deleted successfully'
    });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting task'
    });
  }
};

module.exports = {
  createTask,
  getTasks,
  updateTask,
  deleteTask
};
