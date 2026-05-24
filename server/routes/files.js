const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { validateRoomAccess } = require('../middleware/validateRoomAccess');
const { upload, uploadFile, getFiles, deleteFile } = require('../controllers/fileController');

router.post('/:roomId', authenticate, validateRoomAccess, upload.single('file'), uploadFile);
router.get('/:roomId', authenticate, validateRoomAccess, getFiles);
router.delete('/:fileId', authenticate, deleteFile);

module.exports = router;
