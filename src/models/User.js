const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('node:crypto');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    lowercase: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ]
  },
  phone: {
    type: String,
    trim: true,
    match: [/^[\+]?[1-9][\d]{0,15}$/, 'Please add a valid phone number']
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: 6,
    select: false // Don't include password in queries by default
  },
  role: {
    type: String,
    enum: ['user', 'merchant', 'admin'],
    default: 'user'
  },
  creditLimit: {
    type: Number,
    default: 1000,
    min: [0, 'Credit limit cannot be negative']
  },
  availableCredit: {
    type: Number,
    default: function() { return this.creditLimit; },
    min: [0, 'Available credit cannot be negative']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  favorites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  verificationToken: String,
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  lastLogin: Date
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for used credit
UserSchema.virtual('usedCredit').get(function () {
  return this.creditLimit - this.availableCredit;
});

// Encrypt password using bcrypt
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Update available credit when credit limit changes
UserSchema.pre('save', function (next) {
  if (this.isModified('creditLimit') && !this.isNew) {
    const difference = this.creditLimit - this.constructor.findOne({ _id: this._id }).creditLimit;
    this.availableCredit += difference;
  }
  next();
});

// Sign JWT and return
UserSchema.methods.getSignedJwtToken = function() {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

// Match user entered password to hashed password in database
UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate and hash password token
UserSchema.methods.getResetPasswordToken = function() {
  // Generate token
  const resetToken = crypto.randomBytes(20).toString('hex');

  // Hash token and set to resetPasswordToken field
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Set expire
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

  return resetToken;
};

// Check if user has sufficient credit
UserSchema.methods.hasSufficientCredit = function(amount) {
  return this.availableCredit >= amount;
};

// Reduce available credit
UserSchema.methods.reduceCredit = function(amount) {
  if (this.hasSufficientCredit(amount)) {
    this.availableCredit -= amount;
    return true;
  }
  return false;
};

// Restore available credit
UserSchema.methods.restoreCredit = function(amount) {
  this.availableCredit = Math.min(this.availableCredit + amount, this.creditLimit);
};

module.exports = mongoose.model('User', UserSchema);