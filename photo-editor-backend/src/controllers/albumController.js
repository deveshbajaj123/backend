const Album = require('../models/Album');
const Photo = require('../models/Photo');

// Create album
exports.createAlbum = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Album name is required' });
    }

    const album = await Album.create(req.user.id, name, description);

    res.status(201).json({
      message: 'Album created successfully',
      album,
    });
  } catch (error) {
    console.error('Create album error:', error);
    res.status(500).json({ error: 'Failed to create album' });
  }
};

// Get user's albums
exports.getAlbums = async (req, res) => {
  try {
    const albums = await Album.findByUserId(req.user.id);

    res.json({ albums });
  } catch (error) {
    console.error('Get albums error:', error);
    res.status(500).json({ error: 'Failed to retrieve albums' });
  }
};

// Get single album with photos
exports.getAlbum = async (req, res) => {
  try {
    const album = await Album.findById(req.params.id);

    if (!album) {
      return res.status(404).json({ error: 'Album not found' });
    }

    if (album.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const photos = await Album.getPhotos(album.id);

    res.json({
      album: {
        ...album,
        photos,
      },
    });
  } catch (error) {
    console.error('Get album error:', error);
    res.status(500).json({ error: 'Failed to retrieve album' });
  }
};

// Update album
exports.updateAlbum = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Album name is required' });
    }

    const album = await Album.findById(req.params.id);

    if (!album) {
      return res.status(404).json({ error: 'Album not found' });
    }

    if (album.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updatedAlbum = await Album.update(req.params.id, req.user.id, name, description);

    res.json({
      message: 'Album updated successfully',
      album: updatedAlbum,
    });
  } catch (error) {
    console.error('Update album error:', error);
    res.status(500).json({ error: 'Failed to update album' });
  }
};

// Delete album
exports.deleteAlbum = async (req, res) => {
  try {
    const album = await Album.findById(req.params.id);

    if (!album) {
      return res.status(404).json({ error: 'Album not found' });
    }

    if (album.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await Album.delete(req.params.id, req.user.id);

    res.json({ message: 'Album deleted successfully' });
  } catch (error) {
    console.error('Delete album error:', error);
    res.status(500).json({ error: 'Failed to delete album' });
  }
};

// Add photo to album
exports.addPhotoToAlbum = async (req, res) => {
  try {
    const { photoId } = req.body;

    if (!photoId) {
      return res.status(400).json({ error: 'Photo ID is required' });
    }

    const album = await Album.findById(req.params.id);

    if (!album) {
      return res.status(404).json({ error: 'Album not found' });
    }

    if (album.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Verify photo belongs to user
    const photo = await Photo.findById(photoId);

    if (!photo || photo.user_id !== req.user.id) {
      return res.status(404).json({ error: 'Photo not found' });
    }

    await Album.addPhoto(req.params.id, photoId);

    res.json({ message: 'Photo added to album successfully' });
  } catch (error) {
    console.error('Add photo to album error:', error);
    res.status(500).json({ error: 'Failed to add photo to album' });
  }
};

// Remove photo from album
exports.removePhotoFromAlbum = async (req, res) => {
  try {
    const { photoId } = req.params;

    const album = await Album.findById(req.params.id);

    if (!album) {
      return res.status(404).json({ error: 'Album not found' });
    }

    if (album.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await Album.removePhoto(req.params.id, photoId);

    res.json({ message: 'Photo removed from album successfully' });
  } catch (error) {
    console.error('Remove photo from album error:', error);
    res.status(500).json({ error: 'Failed to remove photo from album' });
  }
};