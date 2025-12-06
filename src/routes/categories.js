const express = require('express');
const {
  getAllCategories,
  getCategoryById,
  getCategoryBySlug
} = require('../controllers/categories');

const router = express.Router();

/**
 * @route   GET /api/categories
 * @desc    Get all categories
 * @access  Public
 */
router.get('/', getAllCategories);

/**
 * @route   GET /api/categories/slug/:slug
 * @desc    Get category by slug
 * @access  Public
 */
router.get('/slug/:slug', getCategoryBySlug);

/**
 * @route   GET /api/categories/:id
 * @desc    Get single category by ID
 * @access  Public
 */
router.get('/:id', getCategoryById);

module.exports = router;