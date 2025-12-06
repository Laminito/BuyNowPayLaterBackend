const express = require('express');
const { body } = require('express-validator');
const {
  createOrder,
  getUserOrders,
  getOrderById,
  cancelOrder,
  getKredikaInstallments,
  updateOrder,
  deleteOrder,
  getOrderKredikaDetails
} = require('../controllers/orders');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(protect);

/**
 * @route   POST /api/orders
 * @desc    Create new order
 * @access  Private
 */
router.post('/', [
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('items.*.productId').notEmpty().withMessage('Product ID is required'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('shippingAddress.firstName').notEmpty().withMessage('First name is required'),
  body('shippingAddress.lastName').notEmpty().withMessage('Last name is required'),
  body('shippingAddress.street').notEmpty().withMessage('Street address is required'),
  body('shippingAddress.city').notEmpty().withMessage('City is required'),
  body('shippingAddress.postalCode').notEmpty().withMessage('Postal code is required'),
  body('paymentMethod').isIn(['kredika', 'card', 'paypal']).withMessage('Valid payment method is required')
], createOrder);

/**
 * @route   GET /api/orders
 * @desc    Get current user orders
 * @access  Private
 */
router.get('/', getUserOrders);

/**
 * @route   GET /api/orders/kredika/installments
 * @desc    Get Kredika installment options for amount
 * @access  Private
 */
router.get('/kredika/installments', getKredikaInstallments);

/**
 * @route   GET /api/orders/:id/kredika
 * @desc    Get Kredika details and sync status
 * @access  Private
 */
router.get('/:id/kredika', getOrderKredikaDetails);

/**
 * @route   GET /api/orders/:id
 * @desc    Get single order by ID
 * @access  Private
 */
router.get('/:id', getOrderById);

/**
 * @route   PUT /api/orders/:id/cancel
 * @desc    Cancel order
 * @access  Private
 */
router.put('/:id/cancel', cancelOrder);

/**
 * @route   PUT /api/orders/:id
 * @desc    Update order (admin only or before payment)
 * @access  Private
 */
router.put('/:id', updateOrder);

/**
 * @route   DELETE /api/orders/:id
 * @desc    Delete order (admin only or before payment)
 * @access  Private
 */
router.delete('/:id', deleteOrder);

module.exports = router;