const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pool = require('../config/database');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 }, // 8 MB limit
  fileFilter: (req, file, cb) => {
    const extname = /\.(pdf|docx)$/i.test(path.extname(file.originalname));
    const allowedMimeTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    const mimetype = allowedMimeTypes.includes(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Invalid file type. Only PDF and DOCX files are allowed.'));
  }
});

const uploadFile = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { sharing_permission } = req.body;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const permission = sharing_permission === 'download' ? 'download' : 'view';

    const [result] = await pool.query(
      'INSERT INTO files (room_id, uploaded_by, file_name, file_path, file_size, file_type, sharing_permission) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [roomId, req.userId, req.file.originalname, req.file.path, req.file.size, req.file.mimetype, permission]
    );

    const [files] = await pool.query(
      `SELECT f.*, u.full_name as uploader_name, u.profile_photo as uploader_photo
       FROM files f
       JOIN users u ON f.uploaded_by = u.id
       WHERE f.id = ?`,
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: 'File uploaded successfully',
      data: { file: files[0] }
    });
  } catch (error) {
    console.error('Upload file error:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading file'
    });
  }
};

const getFiles = async (req, res) => {
  try {
    const { roomId } = req.params;

    const [files] = await pool.query(
      `SELECT f.*, u.full_name as uploader_name, u.profile_photo as uploader_photo
       FROM files f
       JOIN users u ON f.uploaded_by = u.id
       WHERE f.room_id = ?
       ORDER BY f.created_at DESC`,
      [roomId]
    );

    res.status(200).json({
      success: true,
      data: { files }
    });
  } catch (error) {
    console.error('Get files error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching files'
    });
  }
};

const deleteFile = async (req, res) => {
  try {
    const { fileId } = req.params;
    const userId = req.userId;

    const [files] = await pool.query(
      'SELECT * FROM files WHERE id = ?',
      [fileId]
    );

    if (files.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    const file = files[0];

    // Validate room membership & role
    const [members] = await pool.query(
      'SELECT role FROM room_members WHERE room_id = ? AND user_id = ?',
      [file.room_id, userId]
    );

    if (members.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this room'
      });
    }

    const memberRole = members[0].role;
    const isOwnerOrAdmin = memberRole === 'owner' || memberRole === 'admin';
    const isUploader = file.uploaded_by === userId;

    if (!isOwnerOrAdmin && !isUploader) {
      return res.status(403).json({
        success: false,
        message: 'Only the uploader or room admins can delete this file'
      });
    }

    const filePath = file.file_path;
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await pool.query('DELETE FROM files WHERE id = ?', [fileId]);

    res.status(200).json({
      success: true,
      message: 'File deleted successfully'
    });
  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting file'
    });
  }
};

const downloadFile = async (req, res) => {
  try {
    const { fileId } = req.params;
    const userId = req.userId;

    const [files] = await pool.query(
      'SELECT * FROM files WHERE id = ?',
      [fileId]
    );

    if (files.length === 0) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }

    const file = files[0];

    // Validate room membership
    const [members] = await pool.query(
      'SELECT role FROM room_members WHERE room_id = ? AND user_id = ?',
      [file.room_id, userId]
    );

    if (members.length === 0) {
      return res.status(403).json({ success: false, message: 'Access denied to this room' });
    }

    const memberRole = members[0].role;
    const isOwnerOrAdmin = memberRole === 'owner' || memberRole === 'admin';
    const isUploader = file.uploaded_by === userId;

    // Check sharing permission
    if (file.sharing_permission === 'view' && !isOwnerOrAdmin && !isUploader) {
      return res.status(403).json({ success: false, message: 'This file is view-only and cannot be downloaded.' });
    }

    const filePath = path.resolve(file.file_path);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'Physical file not found on disk' });
    }

    res.download(filePath, file.file_name);
  } catch (error) {
    console.error('Download file error:', error);
    res.status(500).json({ success: false, message: 'Error downloading file' });
  }
};

const viewFile = async (req, res) => {
  try {
    const { fileId } = req.params;
    const userId = req.userId;

    const [files] = await pool.query(
      'SELECT * FROM files WHERE id = ?',
      [fileId]
    );

    if (files.length === 0) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }

    const file = files[0];

    // Validate room membership
    const [members] = await pool.query(
      'SELECT role FROM room_members WHERE room_id = ? AND user_id = ?',
      [file.room_id, userId]
    );

    if (members.length === 0) {
      return res.status(403).json({ success: false, message: 'Access denied to this room' });
    }

    const filePath = path.resolve(file.file_path);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'Physical file not found on disk' });
    }

    // Set headers to view inline in browser
    res.setHeader('Content-Type', file.file_type);
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(file.file_name)}"`);
    
    // Stream the file
    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  } catch (error) {
    console.error('View file error:', error);
    res.status(500).json({ success: false, message: 'Error viewing file' });
  }
};

const updateFilePermission = async (req, res) => {
  try {
    const { fileId } = req.params;
    const { sharing_permission } = req.body;
    const userId = req.userId;

    if (!['view', 'download'].includes(sharing_permission)) {
      return res.status(400).json({ success: false, message: 'Invalid permission value' });
    }

    const [files] = await pool.query(
      'SELECT * FROM files WHERE id = ?',
      [fileId]
    );

    if (files.length === 0) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }

    const file = files[0];

    // Check room membership & role
    const [members] = await pool.query(
      'SELECT role FROM room_members WHERE room_id = ? AND user_id = ?',
      [file.room_id, userId]
    );

    if (members.length === 0) {
      return res.status(403).json({ success: false, message: 'Access denied to this room' });
    }

    const memberRole = members[0].role;
    const isOwnerOrAdmin = memberRole === 'owner' || memberRole === 'admin';
    const isUploader = file.uploaded_by === userId;

    if (!isOwnerOrAdmin && !isUploader) {
      return res.status(403).json({ success: false, message: 'Only the uploader or room admins can change permissions.' });
    }

    await pool.query(
      'UPDATE files SET sharing_permission = ? WHERE id = ?',
      [sharing_permission, fileId]
    );

    res.status(200).json({
      success: true,
      message: 'File permission updated successfully',
      data: { fileId, sharing_permission }
    });
  } catch (error) {
    console.error('Update file permission error:', error);
    res.status(500).json({ success: false, message: 'Error updating file permission' });
  }
};

module.exports = {
  upload,
  uploadFile,
  getFiles,
  deleteFile,
  downloadFile,
  viewFile,
  updateFilePermission
};
