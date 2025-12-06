const Review = require('../models/Review');
const Product = require('../models/Product');
const Order = require('../models/Order');
const { validationResult } = require('express-validator');

// @desc    Get all reviews for a product
// @route   GET /api/reviews?productId=...&status=approved&page=1&limit=10
// @access  Public
const getProductReviews = async (req, res) => {
  try {
    const { productId, status = 'approved', page = 1, limit = 10, sort = '-createdAt' } = req.query;

    if (!productId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Product ID is required' 
      });
    }

    // Verify product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ 
        success: false, 
        message: 'Product not found' 
      });
    }

    const skip = (page - 1) * limit;
    const filter = { product: productId };

    if (status) {
      filter.status = status;
    }

    const reviews = await Review.find(filter)
      .populate('user', 'name email')
      .populate('responses.user', 'name email')
      .sort(sort)
      .skip(skip)
      .limit(Number(limit));

    const total = await Review.countDocuments(filter);

    // Calculate rating distribution
    const ratingDistribution = await Review.aggregate([
      { $match: filter },
      { $group: { _id: '$rating', count: { $sum: 1 } } },
      { $sort: { _id: -1 } }
    ]);

    const distribution = {};
    for (let i = 1; i <= 5; i++) {
      distribution[i] = ratingDistribution.find(r => r._id === i)?.count || 0;
    }

    res.json({
      success: true,
      data: reviews,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total
      },
      ratingDistribution: distribution
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// @desc    Get single review
// @route   GET /api/reviews/:id
// @access  Public
const getReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id)
      .populate('user', 'name email')
      .populate('responses.user', 'name email');

    if (!review) {
      return res.status(404).json({ 
        success: false, 
        message: 'Review not found' 
      });
    }

    res.json({ 
      success: true, 
      data: review 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// @desc    Create a new review
// @route   POST /api/reviews
// @access  Private
const createReview = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { productId, title, comment, rating } = req.body;
    const userId = req.user.id;

    // Verify product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ 
        success: false, 
        message: 'Product not found' 
      });
    }

    // Check if user already reviewed this product
    const existingReview = await Review.findOne({ 
      product: productId, 
      user: userId 
    });

    if (existingReview) {
      return res.status(400).json({ 
        success: false, 
        message: 'You have already reviewed this product' 
      });
    }

    // Check if user purchased this product (verified purchase)
    const order = await Order.findOne({
      user: userId,
      'items.product': productId,
      status: { $in: ['delivered', 'shipped'] }
    });

    const review = await Review.create({
      product: productId,
      user: userId,
      title,
      comment,
      rating,
      verified: !!order // Set verified if user has purchased
    });

    await review.populate('user', 'name email');

    res.status(201).json({
      success: true,
      message: 'Review created successfully. It will be published after moderation.',
      data: review
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// @desc    Update a review
// @route   PUT /api/reviews/:id
// @access  Private
const updateReview = async (req, res) => {
  try {
    let review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ 
        success: false, 
        message: 'Review not found' 
      });
    }

    // Check if user owns the review
    if (review.user.toString() !== req.user.id) {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to update this review' 
      });
    }

    const { title, comment, rating } = req.body;

    if (title) review.title = title;
    if (comment) review.comment = comment;
    if (rating) review.rating = rating;

    // Reset status to pending after edit
    review.status = 'pending';

    review = await review.save();
    await review.populate('user', 'name email');

    res.json({
      success: true,
      message: 'Review updated successfully. It will be reviewed again.',
      data: review
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// @desc    Delete a review
// @route   DELETE /api/reviews/:id
// @access  Private
const deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ 
        success: false, 
        message: 'Review not found' 
      });
    }

    // Check if user owns the review
    if (review.user.toString() !== req.user.id) {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to delete this review' 
      });
    }

    await Review.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// @desc    Mark review as helpful
// @route   PUT /api/reviews/:id/helpful
// @access  Private
const markHelpful = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ 
        success: false, 
        message: 'Review not found' 
      });
    }

    const userId = req.user.id;

    // Check if user already marked as helpful
    if (review.usersHelpful.includes(userId)) {
      review.usersHelpful = review.usersHelpful.filter(id => id.toString() !== userId);
      review.helpful = Math.max(0, review.helpful - 1);
    } else {
      review.usersHelpful.push(userId);
      review.helpful += 1;

      // Remove from unhelpful if was there
      if (review.usersUnhelpful.includes(userId)) {
        review.usersUnhelpful = review.usersUnhelpful.filter(id => id.toString() !== userId);
        review.unhelpful = Math.max(0, review.unhelpful - 1);
      }
    }

    await review.save();

    res.json({
      success: true,
      data: {
        helpful: review.helpful,
        unhelpful: review.unhelpful
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// @desc    Mark review as unhelpful
// @route   PUT /api/reviews/:id/unhelpful
// @access  Private
const markUnhelpful = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ 
        success: false, 
        message: 'Review not found' 
      });
    }

    const userId = req.user.id;

    // Check if user already marked as unhelpful
    if (review.usersUnhelpful.includes(userId)) {
      review.usersUnhelpful = review.usersUnhelpful.filter(id => id.toString() !== userId);
      review.unhelpful = Math.max(0, review.unhelpful - 1);
    } else {
      review.usersUnhelpful.push(userId);
      review.unhelpful += 1;

      // Remove from helpful if was there
      if (review.usersHelpful.includes(userId)) {
        review.usersHelpful = review.usersHelpful.filter(id => id.toString() !== userId);
        review.helpful = Math.max(0, review.helpful - 1);
      }
    }

    await review.save();

    res.json({
      success: true,
      data: {
        helpful: review.helpful,
        unhelpful: review.unhelpful
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// @desc    Add response to review (Admin/Seller only)
// @route   POST /api/reviews/:id/response
// @access  Private (Admin/Seller)
const addResponse = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ 
        success: false, 
        message: 'Review not found' 
      });
    }

    const { comment } = req.body;

    if (!comment) {
      return res.status(400).json({ 
        success: false, 
        message: 'Comment is required' 
      });
    }

    review.responses.push({
      user: req.user.id,
      role: req.user.role === 'admin' ? 'admin' : 'seller',
      comment
    });

    await review.save();
    await review.populate('responses.user', 'name email');

    res.json({
      success: true,
      message: 'Response added successfully',
      data: review
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// @desc    Approve or reject review (Admin only)
// @route   PUT /api/reviews/:id/status
// @access  Private (Admin)
const updateReviewStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid status' 
      });
    }

    const review = await Review.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate('user', 'name email');

    if (!review) {
      return res.status(404).json({ 
        success: false, 
        message: 'Review not found' 
      });
    }

    res.json({
      success: true,
      message: `Review ${status} successfully`,
      data: review
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// @desc    Get user's reviews
// @route   GET /api/reviews/user/my-reviews
// @access  Private
const getUserReviews = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const reviews = await Review.find({ user: req.user.id })
      .populate('product', 'name images')
      .populate('responses.user', 'name email')
      .sort('-createdAt')
      .skip(skip)
      .limit(Number(limit));

    const total = await Review.countDocuments({ user: req.user.id });

    res.json({
      success: true,
      data: reviews,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

module.exports = {
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
};
