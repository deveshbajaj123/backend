const multer = require('multer');
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');
const Photo = require('../models/Photo');
const {
  photosContainerClient,
  thumbnailsContainerClient,
  uploadToBlob,
  deleteFromBlob,
} = require('../config/azureStorage');

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only images
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

// Upload photos
exports.uploadPhotos = [
  upload.array('photos', 10), // Max 10 files at once
  async (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'No files uploaded' });
      }

      const uploadedPhotos = [];

      for (const file of req.files) {
        // Generate unique filename
        const fileExt = file.originalname.split('.').pop();
        const fileName = `${uuidv4()}.${fileExt}`;

        // Get image metadata
        const metadata = await sharp(file.buffer).metadata();

        // Upload original image
        const originalUrl = await uploadToBlob(
          photosContainerClient,
          fileName,
          file.buffer,
          file.mimetype
        );

        // Create thumbnail (max 300px width)
        const thumbnailBuffer = await sharp(file.buffer)
          .resize(300, null, { withoutEnlargement: true })
          .jpeg({ quality: 80 })
          .toBuffer();

        const thumbnailFileName = `thumb_${fileName}`;
        const thumbnailUrl = await uploadToBlob(
          thumbnailsContainerClient,
          thumbnailFileName,
          thumbnailBuffer,
          'image/jpeg'
        );

        // Save to database
        const photo = await Photo.create({
          userId: req.user.id,
          filename: file.originalname,
          originalUrl,
          thumbnailUrl,
          fileSize: file.size,
          mimeType: file.mimetype,
          width: metadata.width,
          height: metadata.height,
        });

        uploadedPhotos.push(photo);
      }

      res.status(201).json({
        message: 'Photos uploaded successfully',
        photos: uploadedPhotos,
      });
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ error: 'Failed to upload photos' });
    }
  },
];

// Get user's photos
exports.getPhotos = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;

    const photos = await Photo.findByUserId(req.user.id, limit, offset);
    const total = await Photo.count(req.user.id);

    res.json({
      photos,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get photos error:', error);
    res.status(500).json({ error: 'Failed to retrieve photos' });
  }
};

// Get single photo
exports.getPhoto = async (req, res) => {
  try {
    const photo = await Photo.findById(req.params.id);

    if (!photo) {
      return res.status(404).json({ error: 'Photo not found' });
    }

    if (photo.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ photo });
  } catch (error) {
    console.error('Get photo error:', error);
    res.status(500).json({ error: 'Failed to retrieve photo' });
  }
};

// Delete photo
exports.deletePhoto = async (req, res) => {
  try {
    const photo = await Photo.findById(req.params.id);

    if (!photo) {
      return res.status(404).json({ error: 'Photo not found' });
    }

    if (photo.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Extract filename from URL
    const originalFileName = photo.original_url.split('/').pop();
    const thumbnailFileName = photo.thumbnail_url.split('/').pop();

    // Delete from Azure Blob Storage
    await deleteFromBlob(photosContainerClient, originalFileName);
    await deleteFromBlob(thumbnailsContainerClient, thumbnailFileName);

    // Delete from database
    await Photo.delete(req.params.id, req.user.id);

    res.json({ message: 'Photo deleted successfully' });
  } catch (error) {
    console.error('Delete photo error:', error);
    res.status(500).json({ error: 'Failed to delete photo' });
  }
};

// Search photos
exports.searchPhotos = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({ error: 'Search query required' });
    }

    const photos = await Photo.search(req.user.id, q);

    res.json({ photos, count: photos.length });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
};