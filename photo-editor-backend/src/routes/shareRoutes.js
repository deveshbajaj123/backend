const express = require('express');
const router = express.Router();
const shareController = require('../controllers/shareController');
const authMiddleware = require('../middleware/auth');

// Public route - no auth required
router.get('/:token', shareController.getSharedAlbum);

// Protected routes
router.post('/albums/:albumId', authMiddleware, shareController.createShare);
router.get('/albums/:albumId/shares', authMiddleware, shareController.getAlbumShares);
router.delete('/:shareId', authMiddleware, shareController.deleteShare);

module.exports = router;