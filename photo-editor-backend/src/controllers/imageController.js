const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');
const Photo = require('../models/Photo');
const {
  photosContainerClient,
  thumbnailsContainerClient,
  uploadToBlob,
} = require('../config/azureStorage');

// Apply edits and save new version
exports.saveEditedPhoto = async (req, res) => {
  try {
    const { photoId } = req.params;
    const { edits } = req.body; // { crop, rotate, brightness, contrast, saturation, etc. }

    // Get original photo
    const photo = await Photo.findById(photoId);

    if (!photo) {
      return res.status(404).json({ error: 'Photo not found' });
    }

    if (photo.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Fetch original image from Azure Blob
    const originalFileName = photo.original_url.split('/').pop();
    const blockBlobClient = photosContainerClient.getBlockBlobClient(originalFileName);
    const downloadResponse = await blockBlobClient.download();
    
    // Convert stream to buffer
    const chunks = [];
    for await (const chunk of downloadResponse.readableStreamBody) {
      chunks.push(chunk);
    }
    const imageBuffer = Buffer.concat(chunks);

    // Apply transformations using Sharp
    let image = sharp(imageBuffer);

    // Apply crop if specified
    if (edits.crop) {
      const { x, y, width, height } = edits.crop;
      image = image.extract({
        left: Math.round(x),
        top: Math.round(y),
        width: Math.round(width),
        height: Math.round(height),
      });
    }

    // Apply rotation if specified
    if (edits.rotate) {
      image = image.rotate(edits.rotate);
    }

    // Apply adjustments
    if (edits.brightness || edits.contrast || edits.saturation) {
      const modulate = {};
      if (edits.brightness) modulate.brightness = 1 + (edits.brightness / 100);
      if (edits.saturation) modulate.saturation = 1 + (edits.saturation / 100);
      
      image = image.modulate(modulate);
    }

    // Apply contrast separately (Sharp doesn't have direct contrast in modulate)
    if (edits.contrast) {
      image = image.linear(1 + (edits.contrast / 100), -(128 * edits.contrast / 100));
    }

    // Get processed buffer
    const processedBuffer = await image.toBuffer();
    const metadata = await sharp(processedBuffer).metadata();

    // Generate unique filename for edited version
    const fileExt = originalFileName.split('.').pop();
    const editedFileName = `edited_${uuidv4()}.${fileExt}`;

    // Upload edited image
    const editedUrl = await uploadToBlob(
      photosContainerClient,
      editedFileName,
      processedBuffer,
      `image/${fileExt}`
    );

    // Create thumbnail for edited image
    const thumbnailBuffer = await sharp(processedBuffer)
      .resize(300, null, { withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toBuffer();

    const thumbnailFileName = `thumb_${editedFileName}`;
    const thumbnailUrl = await uploadToBlob(
      thumbnailsContainerClient,
      thumbnailFileName,
      thumbnailBuffer,
      'image/jpeg'
    );

    // Save as new photo in database
    const editedPhoto = await Photo.create({
      userId: req.user.id,
      filename: `edited_${photo.filename}`,
      originalUrl: editedUrl,
      thumbnailUrl,
      fileSize: processedBuffer.length,
      mimeType: `image/${fileExt}`,
      width: metadata.width,
      height: metadata.height,
    });

    res.json({
      message: 'Photo edited successfully',
      photo: editedPhoto,
    });
  } catch (error) {
    console.error('Edit photo error:', error);
    res.status(500).json({ error: 'Failed to edit photo' });
  }
};