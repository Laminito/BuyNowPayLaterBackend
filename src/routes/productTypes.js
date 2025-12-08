const express = require('express');
const { body, validationResult } = require('express-validator');
const {
  getAllProductTypes,
  getProductTypeById,
  getProductTypeByCode,
  createProductType,
  updateProductType,
  deleteProductType,
  generateSKU
} = require('../controllers/productTypes');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Public GET routes (must come before parameterized routes)
/**
 * @route   GET /api/v1/product-types
 * @desc    Get all product types
 * @access  Public
 */
router.get('/', getAllProductTypes);

/**
 * @route   GET /api/v1/product-types/code/:code
 * @desc    Get product type by code
 * @access  Public
 */
router.get('/code/:code', getProductTypeByCode);

// Admin SKU generation route (MUST come before /:id to avoid collision)
/**
 * @route   POST /api/v1/product-types/generate-sku
 * @desc    Generate SKU based on product type and category
 * @access  Private/Admin
 */
router.post(
  '/generate-sku',
  protect,
  authorize('admin'),
  [
    body('productTypeCode')
      .trim()
      .notEmpty()
      .withMessage('Product type code is required'),
    body('categorySlug')
      .trim()
      .notEmpty()
      .withMessage('Category slug is required'),
    body('variant')
      .optional()
      .trim()
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
  },
  generateSKU
);

// Admin POST, PUT, DELETE routes
/**
 * @route   POST /api/v1/product-types
 * @desc    Create new product type
 * @access  Private/Admin
 */
router.post(
  '/',
  protect,
  authorize('admin'),
  [
    body('name')
      .trim()
      .notEmpty()
      .withMessage('Product type name is required'),
    body('code')
      .trim()
      .notEmpty()
      .withMessage('Product type code is required')
      .matches(/^[A-Z0-9-]{2,10}$/)
      .withMessage('Code must be 2-10 characters (uppercase letters, numbers, hyphens only)'),
    body('attributes')
      .optional()
      .isArray()
      .withMessage('Attributes must be an array')
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
  },
  createProductType
);

/**
 * @route   PUT /api/v1/product-types/:id
 * @desc    Update product type
 * @access  Private/Admin
 */
router.put(
  '/:id',
  protect,
  authorize('admin'),
  [
    body('name')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Product type name cannot be empty'),
    body('code')
      .optional()
      .trim()
      .matches(/^[A-Z0-9-]{2,10}$/)
      .withMessage('Code must be 2-10 characters (uppercase letters, numbers, hyphens only)'),
    body('attributes')
      .optional()
      .isArray()
      .withMessage('Attributes must be an array')
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
  },
  updateProductType
);

/**
 * @route   DELETE /api/v1/product-types/:id
 * @desc    Delete product type
 * @access  Private/Admin
 */
router.delete(
  '/:id',
  protect,
  authorize('admin'),
  deleteProductType
);

// Parameterized GET route (must come last to avoid collision)
/**
 * @route   GET /api/v1/product-types/:id
 * @desc    Get single product type by ID
 * @access  Public
 */
router.get('/:id', getProductTypeById);

module.exports = router;
