const ProductType = require('../models/ProductType');

/**
 * @desc    Get all product types
 * @route   GET /api/v1/product-types
 * @access  Public
 */
exports.getAllProductTypes = async (req, res, next) => {
  try {
    const { isActive } = req.query;

    let filter = {};
    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }

    const types = await ProductType.find(filter).sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: types.length,
      data: types
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single product type by ID
 * @route   GET /api/v1/product-types/:id
 * @access  Public
 */
exports.getProductTypeById = async (req, res, next) => {
  try {
    const type = await ProductType.findById(req.params.id);

    if (!type) {
      return res.status(404).json({
        success: false,
        error: 'Product type not found'
      });
    }

    res.status(200).json({
      success: true,
      data: type
    });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(400).json({
        success: false,
        error: 'Invalid product type ID'
      });
    }
    next(error);
  }
};

/**
 * @desc    Get product type by code
 * @route   GET /api/v1/product-types/code/:code
 * @access  Public
 */
exports.getProductTypeByCode = async (req, res, next) => {
  try {
    const type = await ProductType.findOne({
      code: req.params.code.toUpperCase()
    });

    if (!type) {
      return res.status(404).json({
        success: false,
        error: 'Product type not found'
      });
    }

    res.status(200).json({
      success: true,
      data: type
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create new product type
 * @route   POST /api/v1/admin/product-types
 * @access  Private/Admin
 */
exports.createProductType = async (req, res, next) => {
  try {
    const { name, code, description, attributes } = req.body;

    // Validation
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Product type name is required'
      });
    }

    if (!code || !code.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Product type code is required'
      });
    }

    const type = new ProductType({
      name,
      code: code.toUpperCase(),
      description,
      attributes: attributes || []
    });

    await type.save();

    res.status(201).json({
      success: true,
      message: 'Product type created successfully',
      data: type
    });
  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        error: `Product type with this ${field} already exists`
      });
    }
    next(error);
  }
};

/**
 * @desc    Update product type
 * @route   PUT /api/v1/admin/product-types/:id
 * @access  Private/Admin
 */
exports.updateProductType = async (req, res, next) => {
  try {
    let type = await ProductType.findById(req.params.id);

    if (!type) {
      return res.status(404).json({
        success: false,
        error: 'Product type not found'
      });
    }

    const { name, code, description, attributes, isActive } = req.body;

    if (name) type.name = name;
    if (code) type.code = code.toUpperCase();
    if (description !== undefined) type.description = description;
    if (attributes) type.attributes = attributes;
    if (isActive !== undefined) type.isActive = isActive;

    type = await type.save();

    res.status(200).json({
      success: true,
      message: 'Product type updated successfully',
      data: type
    });
  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        error: `Product type with this ${field} already exists`
      });
    }
    if (error.kind === 'ObjectId') {
      return res.status(400).json({
        success: false,
        error: 'Invalid product type ID'
      });
    }
    next(error);
  }
};

/**
 * @desc    Delete product type
 * @route   DELETE /api/v1/admin/product-types/:id
 * @access  Private/Admin
 */
exports.deleteProductType = async (req, res, next) => {
  try {
    const type = await ProductType.findByIdAndDelete(req.params.id);

    if (!type) {
      return res.status(404).json({
        success: false,
        error: 'Product type not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Product type deleted successfully',
      data: type
    });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(400).json({
        success: false,
        error: 'Invalid product type ID'
      });
    }
    next(error);
  }
};

/**
 * @desc    Generate SKU based on product type and category
 * @route   POST /api/v1/admin/product-types/generate-sku
 * @access  Private/Admin
 */
exports.generateSKU = async (req, res, next) => {
  try {
    const { productTypeCode, categorySlug, variant = '' } = req.body;

    if (!productTypeCode || !categorySlug) {
      return res.status(400).json({
        success: false,
        error: 'Product type code and category slug are required'
      });
    }

    // Get product type
    const type = await ProductType.findOne({ code: productTypeCode.toUpperCase() });
    if (!type) {
      return res.status(404).json({
        success: false,
        error: 'Product type not found'
      });
    }

    // Build SKU
    // Format: {TYPE_CODE}-{CATEGORY_SLUG}-{VARIANT}-{TIMESTAMP}
    const timestamp = Date.now().toString().slice(-4); // Last 4 digits of timestamp
    const sku = [
      type.code,
      categorySlug.toUpperCase(),
      variant ? variant.toUpperCase() : 'STD',
      timestamp
    ]
      .filter(Boolean)
      .join('-');

    res.status(200).json({
      success: true,
      message: 'SKU generated successfully',
      data: {
        sku,
        productType: type.name,
        category: categorySlug,
        variant: variant || 'STANDARD'
      }
    });
  } catch (error) {
    next(error);
  }
};
