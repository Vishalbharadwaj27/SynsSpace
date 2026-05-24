const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { validateRoomAccess } = require('../middleware/validateRoomAccess');
const { startSession, endSession, getSessions, getUserStats } = require('../controllers/pomodoroController');

router.post('/:roomId/start', authenticate, validateRoomAccess, startSession);
router.put('/:sessionId/end', authenticate, endSession);
router.get('/:roomId', authenticate, validateRoomAccess, getSessions);
router.get('/stats/user', authenticate, getUserStats);

module.exports = router;
