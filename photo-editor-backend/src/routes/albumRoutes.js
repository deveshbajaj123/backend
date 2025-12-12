const express = require('express');
const router = express.Router();
const albumController = require('../controllers/albumController');
const authMiddleware = require('../middleware/auth');

// All routes require authentication
router.use(authMiddleware);

// Album routes
router.post('/', albumController.createAlbum);
router.get('/', albumController.getAlbums);
router.get('/:id', albumController.getAlbum);
router.put('/:id', albumController.updateAlbum);
router.delete('/:id', albumController.deleteAlbum);

// Album photo management
router.post('/:id/photos', albumController.addPhotoToAlbum);
router.delete('/:id/photos/:photoId', albumController.removePhotoFromAlbum);

module.exports = router;