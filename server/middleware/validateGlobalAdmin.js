const pool = require('../config/database');

const validateGlobalAdmin = async (req, res, next) => {
  try {
    const [users] = await pool.query('SELECT role FROM users WHERE id = ?', [req.userId]);
    
    if (users.length === 0 || users[0].role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Platform Administrator privileges required'
      });
    }
    
    next();
  } catch (error) {
    console.error('Validate global admin error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error validating administrator privileges'
    });
  }
};

module.exports = { validateGlobalAdmin };
