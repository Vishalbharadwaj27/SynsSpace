const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { validateRoomAccess } = require('../middleware/validateRoomAccess');
const { validate, schemas } = require('../middleware/validator');
const { createTask, getTasks, updateTask, deleteTask } = require('../controllers/taskController');

router.post('/:roomId', authenticate, validateRoomAccess, validate(schemas.task), createTask);
router.get('/:roomId', authenticate, validateRoomAccess, getTasks);
router.put('/:taskId', authenticate, validate(schemas.task), updateTask);
router.delete('/:taskId', authenticate, deleteTask);

module.exports = router;
