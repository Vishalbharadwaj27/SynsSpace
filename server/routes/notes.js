const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { validateRoomAccess } = require('../middleware/validateRoomAccess');
const { createNote, getNotes, getNoteById, updateNote, deleteNote } = require('../controllers/noteController');

router.post('/:roomId', authenticate, validateRoomAccess, createNote);
router.get('/:roomId', authenticate, validateRoomAccess, getNotes);
router.get('/note/:noteId', authenticate, getNoteById);
router.put('/:noteId', authenticate, updateNote);
router.delete('/:noteId', authenticate, deleteNote);

module.exports = router;
