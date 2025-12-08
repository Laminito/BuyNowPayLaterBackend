const Category = require('../models/Category');
const Product = require('../models/Product');

const getAllCategories = async (req, res) => {
  try {
    const { includeInactive = false } = req.query;
    
    const filter = includeInactive === 'true' ? {} : { isActive: true };
    
    const categories = await Category.find(filter)
      .populate('parent', 'name slug')
      .sort({ sortOrder: 1, name: 1 });

    // Organiser les catégories en arbre hiérarchique
    const rootCategories = categories.filter(cat => !cat.parent);
    const childCategories = categories.filter(cat => cat.parent);
    
    const categoriesWithChildren = rootCategories.map(root => {
      const children = childCategories.filter(
        child => child.parent._id.toString() === root._id.toString()
      );
      return {
        ...root.toObject(),
        children
      };
    });

    res.json({
      success: true,
      data: categoriesWithChildren
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id)
      .populate('parent', 'name slug');
    
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // Compter les produits dans cette catégorie
    const productCount = await Product.countDocuments({
      category: category._id,
      isActive: true
    });

    // Récupérer les sous-catégories
    const subCategories = await Category.find({
      parent: category._id,
      isActive: true
    }).sort({ sortOrder: 1, name: 1 });

    res.json({
      success: true,
      data: {
        ...category.toObject(),
        productCount,
        subCategories
      }
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({ message: 'Category not found' });
    }
    res.status(500).json({ message: error.message });
  }
};

const getCategoryBySlug = async (req, res) => {
  try {
    const category = await Category.findOne({ 
      slug: req.params.slug,
      isActive: true 
    }).populate('parent', 'name slug');
    
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // Compter les produits dans cette catégorie
    const productCount = await Product.countDocuments({
      category: category._id,
      isActive: true
    });

    // Récupérer les sous-catégories
    const subCategories = await Category.find({
      parent: category._id,
      isActive: true
    }).sort({ sortOrder: 1, name: 1 });

    res.json({
      success: true,
      data: {
        ...category.toObject(),
        productCount,
        subCategories
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Create new category
 * @route   POST /api/v1/admin/categories
 * @access  Private/Admin
 */
const createCategory = async (req, res, next) => {
  try {
    const { name, slug, description, image, parent, sortOrder } = req.body;

    // Validation
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Category name is required'
      });
    }

    // Check if parent category exists (if provided)
    if (parent) {
      const parentCategory = await Category.findById(parent);
      if (!parentCategory) {
        return res.status(404).json({
          success: false,
          error: 'Parent category not found'
        });
      }
    }

    const category = new Category({
      name,
      slug: slug || name.toLowerCase().replace(/\s+/g, '-'),
      description,
      image,
      parent: parent || null,
      sortOrder: sortOrder || 0
    });

    await category.save();
    await category.populate('parent', 'name slug');

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: category
    });
  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        error: `Category with this ${field} already exists`
      });
    }
    next(error);
  }
};

/**
 * @desc    Update category
 * @route   PUT /api/v1/admin/categories/:id
 * @access  Private/Admin
 */
const updateCategory = async (req, res, next) => {
  try {
    let category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Category not found'
      });
    }

    // Check if parent category exists (if provided)
    if (req.body.parent) {
      const parentCategory = await Category.findById(req.body.parent);
      if (!parentCategory) {
        return res.status(404).json({
          success: false,
          error: 'Parent category not found'
        });
      }
    }

    // Update fields
    const { name, slug, description, image, parent, sortOrder, isActive } =
      req.body;

    if (name) category.name = name;
    if (slug) category.slug = slug;
    if (description !== undefined) category.description = description;
    if (image !== undefined) category.image = image;
    if (parent !== undefined) category.parent = parent;
    if (sortOrder !== undefined) category.sortOrder = sortOrder;
    if (isActive !== undefined) category.isActive = isActive;

    category = await category.save();
    await category.populate('parent', 'name slug');

    res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      data: category
    });
  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        error: `Category with this ${field} already exists`
      });
    }
    if (error.kind === 'ObjectId') {
      return res.status(400).json({
        success: false,
        error: 'Invalid category ID'
      });
    }
    next(error);
  }
};

/**
 * @desc    Delete category
 * @route   DELETE /api/v1/admin/categories/:id
 * @access  Private/Admin
 */
const deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Category not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Category deleted successfully',
      data: category
    });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(400).json({
        success: false,
        error: 'Invalid category ID'
      });
    }
    next(error);
  }
};

module.exports = {
  getAllCategories,
  getCategoryById,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory
};