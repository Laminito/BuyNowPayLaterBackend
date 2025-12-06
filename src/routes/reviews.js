const express = require('express');
const { body } = require('express-validator');
const {
  getProductReviews,
  getReview,
  createReview,
  updateReview,
  deleteReview,
  markHelpful,
  markUnhelpful,
  addResponse,
  updateReviewStatus,
  getUserReviews
} = require('../controllers/reviews');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

/**
 * @route   GET /api/v1/reviews
 * @desc    Get all reviews for a product (public)
 * @access  Public
 * @query   productId (required), status (optional), page, limit, sort
 */
router.get('/', getProductReviews);

/**
 * @route   GET /api/v1/reviews/user/my-reviews
 * @desc    Get current user's reviews
 * @access  Private
 */
router.get('/user/my-reviews', protect, getUserReviews);

/**
 * @route   GET /api/v1/reviews/:id
 * @desc    Get single review
 * @access  Public
 */
router.get('/:id', getReview);

/**
 * @route   POST /api/v1/reviews
 * @desc    Create a new review
 * @access  Private
 */
router.post('/', protect, [
  body('productId').notEmpty().withMessage('Product ID is required'),
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 100 }),
  body('comment').trim().notEmpty().withMessage('Comment is required').isLength({ max: 2000 }),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5')
], createReview);

/**
 * @route   PUT /api/v1/reviews/:id
 * @desc    Update a review
 * @access  Private (Review owner)
 */
router.put('/:id', protect, [
  body('title').optional().trim().isLength({ max: 100 }),
  body('comment').optional().trim().isLength({ max: 2000 }),
  body('rating').optional().isInt({ min: 1, max: 5 })
], updateReview);

/**
 * @route   DELETE /api/v1/reviews/:id
 * @desc    Delete a review
 * @access  Private (Review owner)
 */
router.delete('/:id', protect, deleteReview);

/**
 * @route   PUT /api/v1/reviews/:id/helpful
 * @desc    Mark review as helpful
 * @access  Private
 */
router.put('/:id/helpful', protect, markHelpful);

/**
 * @route   PUT /api/v1/reviews/:id/unhelpful
 * @desc    Mark review as unhelpful
 * @access  Private
 */
router.put('/:id/unhelpful', protect, markUnhelpful);

/**
 * @route   POST /api/v1/reviews/:id/response
 * @desc    Add response to review (Admin/Seller)
 * @access  Private (Admin)
 */
router.post('/:id/response', protect, authorize('admin'), [
  body('comment').trim().notEmpty().withMessage('Comment is required')
], addResponse);

/**
 * @route   PUT /api/v1/reviews/:id/status
 * @desc    Approve or reject review (Admin)
 * @access  Private (Admin)
 */
router.put('/:id/status', protect, authorize('admin'), [
  body('status').isIn(['pending', 'approved', 'rejected']).withMessage('Invalid status')
], updateReviewStatus);

module.exports = router;
