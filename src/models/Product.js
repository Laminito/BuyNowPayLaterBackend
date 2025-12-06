const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  originalPrice: {
    type: Number,
    required: false
  },
  discount: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  images: [{
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    alt: { type: String, default: '' }
  }],
  video: {
    url: { type: String },
    publicId: { type: String },
    thumbnail: { type: String },
    duration: { type: Number }, // en secondes
    fileSize: { type: Number } // en bytes
  },
  dimensions: {
    length: Number,
    width: Number,
    height: Number,
    weight: Number
  },
  materials: [String],
  colors: [String],
  inStock: {
    type: Boolean,
    default: true
  },
  stockQuantity: {
    type: Number,
    default: 0
  },
  brand: String,
  sku: {
    type: String,
    unique: true,
    required: true
  },
  tags: [String],
  rating: {
    average: { type: Number, default: 0, min: 0, max: 5 },
    count: { type: Number, default: 0 }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  featured: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index pour la recherche
productSchema.index({ name: 'text', description: 'text', tags: 'text' });
productSchema.index({ category: 1, price: 1 });
productSchema.index({ featured: -1, createdAt: -1 });

module.exports = mongoose.model('Product', productSchema);