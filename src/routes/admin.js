const express = require('express');
const { body } = require('express-validator');
const { protect, authorize } = require('../middleware/auth');
const {
  getSettings,
  updateSettings,
  updateKredikaSettings,
  calculateKredikaFees,
  resetToDefaults
} = require('../controllers/adminSettings');
const { createProduct, updateProduct, deleteProduct } = require('../controllers/admin');

const router = express.Router();

// Toutes les routes nécessitent une authentification admin
router.use(protect);
router.use(authorize('admin'));

/**
 * @route   GET /api/admin/settings
 * @desc    Get admin settings
 * @access  Private/Admin
 */
router.get('/settings', getSettings);

/**
 * @route   PUT /api/admin/settings
 * @desc    Update admin settings
 * @access  Private/Admin
 */
router.put('/settings', updateSettings);

/**
 * @route   PUT /api/admin/settings/kredika
 * @desc    Update Kredika settings
 * @access  Private/Admin
 */
router.put('/settings/kredika', updateKredikaSettings);

/**
 * @route   GET /api/admin/kredika/calculate-fees
 * @desc    Calculate Kredika fees for given amount and duration
 * @access  Private/Admin
 */
router.get('/kredika/calculate-fees', calculateKredikaFees);

/**
 * @route   POST /api/admin/settings/reset
 * @desc    Reset settings to defaults
 * @access  Private/Admin
 */
router.post('/settings/reset', resetToDefaults);

/**
 * @route   POST /api/admin/products
 * @desc    Create a new product
 * @access  Private/Admin
 */
router.post('/products', [
  body('name').trim().notEmpty().withMessage('Product name is required'),
  body('description').trim().notEmpty().withMessage('Product description is required'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('category').notEmpty().withMessage('Category ID is required'),
  body('sku').trim().notEmpty().withMessage('SKU is required'),
  body('images')
    .optional()
    .isArray()
    .withMessage('Images must be an array'),
  body('images.*.url')
    .if(() => false) // Skip validation if images is not present
    .isURL()
    .withMessage('Image URL must be valid'),
  body('images.*.publicId')
    .if(() => false) // Skip validation if images is not present
    .notEmpty()
    .withMessage('Image publicId is required'),
  body('materials')
    .optional()
    .isArray()
    .withMessage('Materials must be an array'),
  body('colors')
    .optional()
    .isArray()
    .withMessage('Colors must be an array')
], createProduct);

/**
 * @route   PUT /api/admin/products/:id
 * @desc    Update product
 * @access  Private/Admin
 */
router.put('/products/:id', updateProduct);

/**
 * @route   DELETE /api/admin/products/:id
 * @desc    Delete product
 * @access  Private/Admin
 */
router.delete('/products/:id', deleteProduct);

module.exports = router;