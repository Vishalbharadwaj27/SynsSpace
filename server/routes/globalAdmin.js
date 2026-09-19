const express = require('express');
const router = express.Router();
const { validate, schemas } = require('../middleware/validator');
const {
  getAllWorkspaces,
  getWorkspaceDetails,
  updateMemberRole,
  removeMember,
  deleteMessage,
  deleteFile
} = require('../controllers/globalAdminController');

// All endpoints in this file are secured for platform-level admins
router.use(authenticate, validateGlobalAdmin);

router.get('/workspaces', getAllWorkspaces);
router.get('/workspaces/:roomId', getWorkspaceDetails);
router.put('/workspaces/:roomId/members/:userId/role', validate(schemas.roleUpdate), updateMemberRole);
router.delete('/workspaces/:roomId/members/:userId', removeMember);
router.delete('/messages/:messageId', deleteMessage);
router.delete('/files/:fileId', deleteFile);

module.exports = router;
