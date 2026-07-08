const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { validateRoomAccess } = require('../middleware/validateRoomAccess');
const { createRoom, getRooms, getRoomById, joinRoom, joinRoomById, getUserRooms, leaveRoom } = require('../controllers/roomController');

router.post('/', authenticate, createRoom);
router.get('/', authenticate, getRooms);
router.get('/my-rooms', authenticate, getUserRooms);
router.post('/join', authenticate, joinRoom);
router.post('/:roomId/join', authenticate, joinRoomById);
router.get('/:roomId', authenticate, getRoomById);
router.delete('/:roomId', authenticate, leaveRoom);

module.exports = router;
