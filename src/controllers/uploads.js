const uploadService = require('../services/uploadService');
const User = require('../models/User');

const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Supprimer l'ancien avatar s'il existe
    const user = await User.findById(req.user.id);
    if (user.avatar) {
      const publicIdMatch = user.avatar.match(/\/([^/]+)\.[^.]+$/);
      if (publicIdMatch) {
        const publicId = `avatars/${publicIdMatch[1]}`;
        await uploadService.deleteImage(publicId);
      }
    }

    // Upload du nouveau avatar
    const uploadResult = await uploadService.uploadAvatar(req.file);

    // Mettre à jour l'utilisateur
    user.avatar = uploadResult.url;
    await user.save();

    res.json({
      success: true,
      avatar: uploadResult.url,
      message: 'Avatar updated successfully'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const uploadProductImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    const uploadResults = await uploadService.uploadProductImages(req.files);

    res.json({
      success: true,
      images: uploadResults,
      message: 'Images uploaded successfully'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const uploadProductVideo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No video file uploaded' });
    }

    const uploadResult = await uploadService.uploadProductVideo(req.file);

    res.json({
      success: true,
      video: uploadResult,
      message: 'Video uploaded successfully'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const uploadProductMedia = async (req, res) => {
  try {
    if (!req.files || (!req.files.images && !req.files.video)) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    const uploadResults = await uploadService.uploadProductMedia(req.files);

    res.json({
      success: true,
      media: uploadResults,
      message: 'Media uploaded successfully'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteImage = async (req, res) => {
  try {
    const { publicId } = req.params;
    
    if (!publicId) {
      return res.status(400).json({ message: 'Public ID is required' });
    }

    await uploadService.deleteImage(publicId);

    res.json({
      success: true,
      message: 'Image deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  uploadAvatar,
  uploadProductImages,
  uploadProductVideo,
  uploadProductMedia,
  deleteImage
};