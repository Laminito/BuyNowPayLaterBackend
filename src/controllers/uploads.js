const localUploadService = require('../services/localUploadService');
const User = require('../models/User');

const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    // Supprimer l'ancien avatar s'il existe
    const user = await User.findById(req.user.id);
    if (user.avatar) {
      await localUploadService.deleteImage(user.avatar);
    }

    // Upload du nouveau avatar
    const uploadResult = await localUploadService.uploadAvatar(req.file);

    // Mettre à jour l'utilisateur
    user.avatar = uploadResult.url;
    await user.save();

    res.json({
      success: true,
      avatar: uploadResult.url,
      message: 'Avatar updated successfully'
    });
  } catch (error) {
    console.error('Upload avatar error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message,
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

const uploadProductImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No files uploaded' });
    }

    const uploadResults = await localUploadService.uploadProductImages(req.files);

    res.json({
      success: true,
      images: uploadResults,
      message: 'Images uploaded successfully'
    });
  } catch (error) {
    console.error('Upload images error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message,
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

const uploadProductVideo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No video file uploaded' });
    }

    const uploadResult = await localUploadService.uploadProductVideo(req.file);

    res.json({
      success: true,
      video: uploadResult,
      message: 'Video uploaded successfully'
    });
  } catch (error) {
    console.error('Upload video error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message,
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

const uploadProductMedia = async (req, res) => {
  try {
    if (!req.files || (!req.files.images && !req.files.video)) {
      return res.status(400).json({ success: false, message: 'No files uploaded' });
    }

    const uploadResults = await localUploadService.uploadProductMedia(req.files);

    res.json({
      success: true,
      media: uploadResults,
      message: 'Media uploaded successfully'
    });
  } catch (error) {
    console.error('Upload media error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message,
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

const deleteImage = async (req, res) => {
  try {
    const { filePath } = req.params;
    
    if (!filePath) {
      return res.status(400).json({ success: false, message: 'File path is required' });
    }

    const result = await localUploadService.deleteImage(filePath);

    if (result.success) {
      res.json({ success: true, message: 'Image deleted successfully' });
    } else {
      res.status(404).json({ success: false, message: result.message });
    }
  } catch (error) {
    console.error('Delete image error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message,
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
}

module.exports = {
  uploadAvatar,
  uploadProductImages,
  uploadProductVideo,
  uploadProductMedia,
  deleteImage
};