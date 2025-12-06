const express = require('express');
const {
  getUserFavorites,
  addToFavorites,
  removeFromFavorites,
  toggleFavorite
} = require('../controllers/favorites');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(protect);

/**
 * @route   GET /api/favorites
 * @desc    Get current user favorites
 * @access  Private
 */
router.get('/', getUserFavorites);

/**
 * @route   POST /api/favorites/:productId
 * @desc    Add product to favorites
 * @access  Private
 */
router.post('/:productId', addToFavorites);

/**
 * @route   DELETE /api/favorites/:productId
 * @desc    Remove product from favorites
 * @access  Private
 */
router.delete('/:productId', removeFromFavorites);

/**
 * @route   PUT /api/favorites/:productId/toggle
 * @desc    Toggle product favorite status
 * @access  Private
 */
router.put('/:productId/toggle', toggleFavorite);

module.exports = router;