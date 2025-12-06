const express = require('express');
const {
  uploadAvatar,
  uploadProductImages,
  uploadProductVideo,
  uploadProductMedia,
  deleteImage
} = require('../controllers/uploads');
const { protect } = require('../middleware/auth');
const {
  uploadAvatar: uploadAvatarMiddleware,
  uploadProductImages: uploadProductImagesMiddleware,
  uploadProductVideo: uploadProductVideoMiddleware,
  uploadProductMedia: uploadProductMediaMiddleware
} = require('../middleware/upload');

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(protect);

/**
 * @route   POST /api/uploads/avatar
 * @desc    Upload user avatar
 * @access  Private
 */
router.post('/avatar', uploadAvatarMiddleware, uploadAvatar);

/**
 * @route   POST /api/uploads/product-images
 * @desc    Upload product images
 * @access  Private (Admin only in production)
 */
router.post('/product-images', uploadProductImagesMiddleware, uploadProductImages);

/**
 * @route   POST /api/uploads/product-video
 * @desc    Upload product video
 * @access  Private (Admin only in production)
 */
router.post('/product-video', uploadProductVideoMiddleware, uploadProductVideo);

/**
 * @route   POST /api/uploads/product-media
 * @desc    Upload product images and video
 * @access  Private (Admin only in production)
 */
router.post('/product-media', uploadProductMediaMiddleware, uploadProductMedia);

/**
 * @route   DELETE /api/uploads/image/:publicId
 * @desc    Delete image by public ID
 * @access  Private (Admin only in production)
 */
router.delete('/image/:publicId', deleteImage);

module.exports = router;