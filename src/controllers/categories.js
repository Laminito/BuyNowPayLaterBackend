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

module.exports = {
  getAllCategories,
  getCategoryById,
  getCategoryBySlug
};