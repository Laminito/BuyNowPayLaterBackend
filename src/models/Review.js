const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Please add a review title'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  comment: {
    type: String,
    required: [true, 'Please add a comment'],
    maxlength: [2000, 'Comment cannot be more than 2000 characters']
  },
  rating: {
    type: Number,
    required: [true, 'Please add a rating between 1 and 5'],
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot be more than 5']
  },
  helpful: {
    type: Number,
    default: 0,
    min: 0
  },
  unhelpful: {
    type: Number,
    default: 0,
    min: 0
  },
  verified: {
    type: Boolean,
    default: false, // Set to true if user purchased the product
    description: 'Verified purchase'
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
    description: 'Review moderation status'
  },
  images: [{
    url: String,
    publicId: String,
    alt: String
  }],
  usersHelpful: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  usersUnhelpful: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  responses: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['seller', 'admin'],
      default: 'seller'
    },
    comment: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Prevent duplicate reviews from same user for same product
reviewSchema.index({ product: 1, user: 1 }, { unique: true });

// Populate user details before returning
reviewSchema.pre(/^find/, function(next) {
  if (this.options._recursed) {
    return next();
  }
  this.populate({
    path: 'user',
    select: 'name email',
    options: { _recursed: true }
  });
  this.populate({
    path: 'responses.user',
    select: 'name email role',
    options: { _recursed: true }
  });
  next();
});

// Update product rating when review is saved
reviewSchema.post('save', async function(doc) {
  const Product = mongoose.model('Product');
  const reviews = await this.constructor.find({ 
    product: doc.product,
    status: 'approved'
  });
  
  if (reviews.length > 0) {
    const avgRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
    await Product.findByIdAndUpdate(
      doc.product,
      { 
        'rating.average': Math.round(avgRating * 10) / 10,
        'rating.count': reviews.length
      }
    );
  }
});

// Update product rating when review is deleted
reviewSchema.post('findByIdAndDelete', async function(doc) {
  if (doc) {
    const Product = mongoose.model('Product');
    const reviews = await this.model.find({ 
      product: doc.product,
      status: 'approved'
    });
    
    if (reviews.length > 0) {
      const avgRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
      await Product.findByIdAndUpdate(
        doc.product,
        { 
          'rating.average': Math.round(avgRating * 10) / 10,
          'rating.count': reviews.length
        }
      );
    } else {
      await Product.findByIdAndUpdate(
        doc.product,
        { 
          'rating.average': 0,
          'rating.count': 0
        }
      );
    }
  }
});

module.exports = mongoose.model('Review', reviewSchema);
