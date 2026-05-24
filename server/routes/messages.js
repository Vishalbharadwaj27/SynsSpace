const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { validateRoomAccess } = require('../middleware/validateRoomAccess');
const { sendMessage, getMessages } = require('../controllers/messageController');

router.post('/:roomId', authenticate, validateRoomAccess, sendMessage);
router.get('/:roomId', authenticate, validateRoomAccess, getMessages);

module.exports = router;
