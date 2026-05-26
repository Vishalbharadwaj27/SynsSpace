const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { register, login, getMe, updateProfile, forgotPassword, resetPassword } = require('../controllers/authController');

router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticate, getMe);
router.put('/profile', authenticate, updateProfile);
router.post('/forgot-password', forgotPassword);
router.patch('/reset-password', resetPassword);

module.exports = router;
