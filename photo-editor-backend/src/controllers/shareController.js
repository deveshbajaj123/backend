const Share = require('../models/Share');
const Album = require('../models/Album');

// Create share link for album
exports.createShare = async (req, res) => {
  try {
    const { albumId } = req.params;
    const { expiresInDays } = req.body; // optional

    // Verify album exists and belongs to user
    const album = await Album.findById(albumId);

    if (!album) {
      return res.status(404).json({ error: 'Album not found' });
    }

    if (album.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Create share
    const share = await Share.create(albumId, req.user.id, expiresInDays);

    // Generate full share URL
    const shareUrl = `${process.env.FRONTEND_URL}/shared/${share.share_token}`;

    res.status(201).json({
      message: 'Share link created successfully',
      share: {
        ...share,
        shareUrl,
      },
    });
  } catch (error) {
    console.error('Create share error:', error);
    res.status(500).json({ error: 'Failed to create share link' });
  }
};

// Get shared album (public endpoint - no auth required)
exports.getSharedAlbum = async (req, res) => {
  try {
    const { token } = req.params;

    const share = await Share.findByToken(token);

    if (!share) {
      return res.status(404).json({ error: 'Share link not found or expired' });
    }

    // Get album photos
    const photos = await Album.getPhotos(share.album_id);

    res.json({
      album: {
        id: share.album_id,
        name: share.album_name,
        description: share.album_description,
        sharedBy: share.shared_by_name,
        photos,
      },
    });
  } catch (error) {
    console.error('Get shared album error:', error);
    res.status(500).json({ error: 'Failed to retrieve shared album' });
  }
};

// Get shares for an album
exports.getAlbumShares = async (req, res) => {
  try {
    const { albumId } = req.params;

    const album = await Album.findById(albumId);

    if (!album) {
      return res.status(404).json({ error: 'Album not found' });
    }

    if (album.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const shares = await Share.findByAlbumId(albumId);

    // Add full URLs
    const sharesWithUrls = shares.map(share => ({
      ...share,
      shareUrl: `${process.env.FRONTEND_URL}/shared/${share.share_token}`,
    }));

    res.json({ shares: sharesWithUrls });
  } catch (error) {
    console.error('Get shares error:', error);
    res.status(500).json({ error: 'Failed to retrieve shares' });
  }
};

// Delete share link
exports.deleteShare = async (req, res) => {
  try {
    const { shareId } = req.params;

    const deletedShare = await Share.delete(shareId, req.user.id);

    if (!deletedShare) {
      return res.status(404).json({ error: 'Share link not found' });
    }

    res.json({ message: 'Share link deleted successfully' });
  } catch (error) {
    console.error('Delete share error:', error);
    res.status(500).json({ error: 'Failed to delete share link' });
  }
};