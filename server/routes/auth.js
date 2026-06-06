const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { register, login, getMe, updateProfile, forgotPassword, directResetPassword } = require('../controllers/authController');

router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticate, getMe);
router.put('/profile', authenticate, updateProfile);
router.post('/forgot-password', forgotPassword);
router.post('/direct-reset', directResetPassword);

module.exports = router;
