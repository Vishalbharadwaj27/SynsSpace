const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { validateRoomAccess } = require('../middleware/validateRoomAccess');
const { createTask, getTasks, updateTask, deleteTask } = require('../controllers/taskController');

router.post('/:roomId', authenticate, validateRoomAccess, createTask);
router.get('/:roomId', authenticate, validateRoomAccess, getTasks);
router.put('/:taskId', authenticate, updateTask);
router.delete('/:taskId', authenticate, deleteTask);

module.exports = router;
