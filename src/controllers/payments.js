const { validationResult } = require('express-validator');
const Payment = require('../models/Payment');
const User = require('../models/User');

// @desc    Create new payment
// @route   POST /api/payments
// @access  Private
const createPayment = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const {
      merchantId,
      merchantName,
      productId,
      productName,
      totalAmount,
      downPayment = 0,
      installments,
      interestRate = 0
    } = req.body;

    // Get user and check credit availability
    const user = await User.findById(req.user.id);
    const requiredCredit = totalAmount - downPayment;

    if (!user.hasSufficientCredit(requiredCredit)) {
      return res.status(400).json({
        success: false,
        error: `Insufficient credit. Required: ${requiredCredit}, Available: ${user.availableCredit}`
      });
    }

    // Create payment
    const payment = await Payment.create({
      user: req.user.id,
      merchantId,
      merchantName,
      productId,
      productName,
      totalAmount,
      downPayment,
      installments,
      interestRate,
      status: 'pending'
    });

    // Populate user data
    await payment.populate('user', 'name email');

    res.status(201).json({
      success: true,
      data: payment
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all payments
// @route   GET /api/payments
// @access  Private/Admin
const getPayments = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;

    // Build query
    let query = {};
    
    // Filter by status
    if (req.query.status) {
      query.status = req.query.status;
    }

    // Filter by merchant
    if (req.query.merchantId) {
      query.merchantId = req.query.merchantId;
    }

    // Filter by user
    if (req.query.userId) {
      query.user = req.query.userId;
    }

    const payments = await Payment.find(query)
      .populate('user', 'name email')
      .skip(startIndex)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Payment.countDocuments(query);

    res.status(200).json({
      success: true,
      count: payments.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: payments
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single payment
// @route   GET /api/payments/:id
// @access  Private
const getPayment = async (req, res, next) => {
  try {
    let query = { _id: req.params.id };
    
    // Non-admin users can only see their own payments
    if (req.user.role !== 'admin') {
      query.user = req.user.id;
    }

    const payment = await Payment.findOne(query)
      .populate('user', 'name email');

    if (!payment) {
      return res.status(404).json({
        success: false,
        error: 'Payment not found'
      });
    }

    res.status(200).json({
      success: true,
      data: payment,
      summary: payment.getPaymentSummary()
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update payment
// @route   PUT /api/payments/:id
// @access  Private/Admin
const updatePayment = async (req, res, next) => {
  try {
    let payment = await Payment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({
        success: false,
        error: 'Payment not found'
      });
    }

    // Handle status updates that affect user credit
    if (req.body.status && req.body.status !== payment.status) {
      const user = await User.findById(payment.user);
      
      if (req.body.status === 'approved' && payment.status === 'pending') {
        // Approve payment - reduce user's available credit
        if (!user.reduceCredit(payment.remainingAmount)) {
          return res.status(400).json({
            success: false,
            error: 'Insufficient credit to approve payment'
          });
        }
        payment.approvedAt = new Date();
        payment.status = 'active';
        await user.save();
      } else if (req.body.status === 'cancelled') {
        // Cancel payment - restore user's credit if it was approved
        if (payment.status === 'active' || payment.status === 'approved') {
          user.restoreCredit(payment.remainingAmount);
          await user.save();
        }
        payment.cancelledAt = new Date();
        payment.cancelReason = req.body.cancelReason || 'Cancelled by admin';
      }
    }

    // Update other allowed fields
    const allowedUpdates = ['status', 'cancelReason'];
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        payment[field] = req.body[field];
      }
    });

    await payment.save();

    await payment.populate('user', 'name email');

    res.status(200).json({
      success: true,
      data: payment
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete payment
// @route   DELETE /api/payments/:id
// @access  Private/Admin
const deletePayment = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({
        success: false,
        error: 'Payment not found'
      });
    }

    // Restore user's credit if payment was active
    if (payment.status === 'active' || payment.status === 'approved') {
      const user = await User.findById(payment.user);
      user.restoreCredit(payment.remainingAmount);
      await user.save();
    }

    await payment.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Payment deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Process payment installment
// @route   POST /api/payments/:id/process
// @access  Private
const processPayment = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { installmentNumber, paymentMethod = 'card', transactionId } = req.body;

    let query = { _id: req.params.id, status: 'active' };
    
    // Non-admin users can only process their own payments
    if (req.user.role !== 'admin') {
      query.user = req.user.id;
    }

    const payment = await Payment.findOne(query);

    if (!payment) {
      return res.status(404).json({
        success: false,
        error: 'Payment not found or not active'
      });
    }

    try {
      const processedInstallment = payment.processInstallmentPayment(
        installmentNumber,
        paymentMethod,
        transactionId || `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      );

      await payment.save();

      res.status(200).json({
        success: true,
        message: 'Payment processed successfully',
        data: {
          payment: payment,
          processedInstallment: processedInstallment,
          summary: payment.getPaymentSummary()
        }
      });
    } catch (installmentError) {
      return res.status(400).json({
        success: false,
        error: installmentError.message
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user payments
// @route   GET /api/payments/my-payments
// @access  Private
const getUserPayments = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;

    let query = { user: req.user.id };
    
    // Filter by status
    if (req.query.status) {
      query.status = req.query.status;
    }

    const payments = await Payment.find(query)
      .skip(startIndex)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Payment.countDocuments(query);

    // Add summary to each payment
    const paymentsWithSummary = payments.map(payment => ({
      ...payment.toObject(),
      summary: payment.getPaymentSummary()
    }));

    res.status(200).json({
      success: true,
      count: payments.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: paymentsWithSummary
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPayment,
  getPayments,
  getPayment,
  updatePayment,
  deletePayment,
  processPayment,
  getUserPayments
};