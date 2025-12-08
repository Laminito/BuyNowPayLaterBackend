const mongoose = require('mongoose');

const productTypeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product type name is required'],
      unique: true,
      trim: true
    },
    code: {
      type: String,
      required: [true, 'Product type code is required'],
      unique: true,
      uppercase: true,
      trim: true,
      maxlength: 10
    },
    description: String,
    attributes: [
      {
        name: String,
        fieldType: { type: String }, // text, number, select, etc. (renamed to avoid conflict with type)
        required: Boolean,
        options: [String] // pour les select
      }
    ],
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('ProductType', productTypeSchema);
