const express = require('express');
const router = express.Router();
const imageController = require('../controllers/imageController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

// Save edited photo
router.post('/:photoId/edit', imageController.saveEditedPhoto);

module.exports = router;