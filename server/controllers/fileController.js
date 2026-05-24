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
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf|doc|docx|txt|zip/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Invalid file type'));
  }
});

const uploadFile = async (req, res) => {
  try {
    const { roomId } = req.params;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const [result] = await pool.query(
      'INSERT INTO files (room_id, uploaded_by, file_name, file_path, file_size, file_type) VALUES (?, ?, ?, ?, ?, ?)',
      [roomId, req.userId, req.file.originalname, req.file.path, req.file.size, req.file.mimetype]
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

    const [files] = await pool.query(
      'SELECT file_path FROM files WHERE id = ?',
      [fileId]
    );

    if (files.length > 0) {
      const filePath = files[0].file_path;
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
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

module.exports = {
  upload,
  uploadFile,
  getFiles,
  deleteFile
};
