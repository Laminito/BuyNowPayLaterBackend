const Product = require('../models/Product');
const Category = require('../models/Category');
const { validationResult } = require('express-validator');

/**
 * @desc    Create a new product
 * @route   POST /api/v1/admin/products
 * @access  Private/Admin
 */
const createProduct = async (req, res, next) => {
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
      name,
      description,
      price,
      originalPrice,
      discount,
      category,
      images,
      video,
      dimensions,
      materials,
      colors,
      inStock,
      stockQuantity,
      brand,
      sku,
      tags,
      featured,
      isActive
    } = req.body;

    // Check if category exists
    const categoryDoc = await Category.findById(category);
    if (!categoryDoc) {
      return res.status(404).json({
        success: false,
        error: 'Category not found'
      });
    }

    // Check if SKU already exists
    const existingProduct = await Product.findOne({ sku });
    if (existingProduct) {
      return res.status(400).json({
        success: false,
        error: 'Product with this SKU already exists'
      });
    }

    // Create product
    const product = await Product.create({
      name: name.trim(),
      description: description.trim(),
      price,
      originalPrice: originalPrice || price,
      discount: discount || 0,
      category,
      images: images || [],
      video: video || {},
      dimensions: dimensions || {},
      materials: materials || [],
      colors: colors || [],
      inStock: inStock !== undefined ? inStock : true,
      stockQuantity: stockQuantity || 0,
      brand: brand || '',
      sku: sku.trim().toUpperCase(),
      tags: tags || [],
      featured: featured || false,
      isActive: isActive !== undefined ? isActive : true
    });

    // Populate category
    await product.populate('category', 'name slug');

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product
    });
  } catch (error) {
    if (error.code === 11000) {
      // Duplicate key error
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        error: `Product with this ${field} already exists`
      });
    }
    next(error);
  }
};

/**
 * @desc    Update product
 * @route   PUT /api/v1/admin/products/:id
 * @access  Private/Admin
 */
const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Find product
    let product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    // If category is being updated, verify it exists
    if (updateData.category && updateData.category !== product.category.toString()) {
      const categoryDoc = await Category.findById(updateData.category);
      if (!categoryDoc) {
        return res.status(404).json({
          success: false,
          error: 'Category not found'
        });
      }
    }

    // Update product
    product = await Product.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true
    }).populate('category', 'name slug');

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: product
    });
  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        error: `Product with this ${field} already exists`
      });
    }
    next(error);
  }
};

/**
 * @desc    Delete product
 * @route   DELETE /api/v1/admin/products/:id
 * @access  Private/Admin
 */
const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    await Product.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createProduct,
  updateProduct,
  deleteProduct
};
