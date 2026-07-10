const express = require('express');
const router = express.Router({ mergeParams: true });
const { authenticate } = require('../middleware/auth');
const { validateRoomAdmin } = require('../middleware/validateRoomAccess');
const {
  getStats,
  getMembers,
  updateMemberRole,
  removeMember,
  deleteMessage,
  deleteFile
} = require('../controllers/adminController');

router.get('/stats', authenticate, validateRoomAdmin, getStats);
router.get('/members', authenticate, validateRoomAdmin, getMembers);
router.put('/members/:userId/role', authenticate, validateRoomAdmin, updateMemberRole);
router.delete('/members/:userId', authenticate, validateRoomAdmin, removeMember);
router.delete('/messages/:messageId', authenticate, validateRoomAdmin, deleteMessage);
router.delete('/files/:fileId', authenticate, validateRoomAdmin, deleteFile);

module.exports = router;
