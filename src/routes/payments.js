const express = require('express');
const { body } = require('express-validator');
const {
  createPayment,
  getPayments,
  getPayment,
  updatePayment,
  deletePayment,
  processPayment,
  getUserPayments
} = require('../controllers/payments');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/payments
// @desc    Create new payment
// @access  Private
router.post('/', protect, [
  body('amount').isNumeric().withMessage('Amount must be a number'),
  body('merchantId').notEmpty().withMessage('Merchant ID is required'),
  body('productId').notEmpty().withMessage('Product ID is required'),
  body('installments').isInt({ min: 1, max: 12 }).withMessage('Installments must be between 1 and 12')
], createPayment);

// @route   GET /api/payments
// @desc    Get all payments
// @access  Private/Admin
router.get('/', protect, authorize('admin'), getPayments);

// @route   GET /api/payments/my-payments
// @desc    Get current user payments
// @access  Private
router.get('/my-payments', protect, getUserPayments);

// @route   GET /api/payments/:id
// @desc    Get single payment
// @access  Private
router.get('/:id', protect, getPayment);

// @route   PUT /api/payments/:id
// @desc    Update payment
// @access  Private/Admin
router.put('/:id', protect, authorize('admin'), updatePayment);

// @route   DELETE /api/payments/:id
// @desc    Delete payment
// @access  Private/Admin
router.delete('/:id', protect, authorize('admin'), deletePayment);

// @route   POST /api/payments/:id/process
// @desc    Process payment installment
// @access  Private
router.post('/:id/process', protect, [
  body('installmentNumber').isInt({ min: 1 }).withMessage('Valid installment number is required')
], processPayment);

module.exports = router;