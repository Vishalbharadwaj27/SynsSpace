const bcrypt = require('bcryptjs');
const pool = require('../config/database');
const { generateToken } = require('../config/jwt');

const register = async (req, res) => {
  try {
    const { email, password, full_name, bio, study_interests } = req.body;

    if (!email || !password || !full_name) {
      return res.status(400).json({
        success: false,
        message: 'Email, password, and full name are required'
      });
    }

    const [existingUsers] = await pool.query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Email already registered'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await pool.query(
      'INSERT INTO users (email, password, full_name, bio, study_interests) VALUES (?, ?, ?, ?, ?)',
      [email, hashedPassword, full_name, bio || null, study_interests || null]
    );

    const token = generateToken(result.insertId);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: result.insertId,
          email,
          full_name,
          bio,
          study_interests
        },
        token
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Error registering user'
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    const [users] = await pool.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const user = users[0];
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const token = generateToken(user.id);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          profile_photo: user.profile_photo,
          bio: user.bio,
          study_interests: user.study_interests,
          role: user.role,
          total_study_hours: user.total_study_hours
        },
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Error logging in'
    });
  }
};

const getMe = async (req, res) => {
  try {
    const [users] = await pool.query(
      'SELECT id, email, full_name, profile_photo, bio, study_interests, role, total_study_hours, created_at FROM users WHERE id = ?',
      [req.userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: { user: users[0] }
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user data'
    });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { full_name, bio, study_interests, profile_photo } = req.body;

    await pool.query(
      'UPDATE users SET full_name = ?, bio = ?, study_interests = ?, profile_photo = ? WHERE id = ?',
      [full_name, bio, study_interests, profile_photo, req.userId]
    );

    const [users] = await pool.query(
      'SELECT id, email, full_name, profile_photo, bio, study_interests, role, total_study_hours FROM users WHERE id = ?',
      [req.userId]
    );

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: { user: users[0] }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating profile'
    });
  }
};

module.exports = {
  register,
  login,
  getMe,
  updateProfile
};
