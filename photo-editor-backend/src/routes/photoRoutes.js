const express = require('express');
const router = express.Router();
const photoController = require('../controllers/PhotoController');
const authMiddleware = require('../middleware/auth');

// All routes require authentication
router.use(authMiddleware);

// Photo routes
router.post('/upload', photoController.uploadPhotos);
router.get('/', photoController.getPhotos);
router.get('/search', photoController.searchPhotos);
router.get('/:id', photoController.getPhoto);
router.delete('/:id', photoController.deletePhoto);

module.exports = router;