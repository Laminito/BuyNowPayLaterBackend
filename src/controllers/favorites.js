const User = require('../models/User');
const Product = require('../models/Product');

const getUserFavorites = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate({
        path: 'favorites',
        match: { isActive: true },
        populate: {
          path: 'category',
          select: 'name slug'
        }
      });

    res.json({
      success: true,
      data: user.favorites
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const addToFavorites = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user.id;

    // Vérifier que le produit existe
    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Ajouter aux favoris si pas déjà présent
    const user = await User.findById(userId);
    if (!user.favorites.includes(productId)) {
      user.favorites.push(productId);
      await user.save();
    }

    res.json({
      success: true,
      message: 'Product added to favorites'
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.status(500).json({ message: error.message });
  }
};

const removeFromFavorites = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user.id;

    const user = await User.findById(userId);
    user.favorites = user.favorites.filter(
      fav => fav.toString() !== productId
    );
    await user.save();

    res.json({
      success: true,
      message: 'Product removed from favorites'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const toggleFavorite = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user.id;

    // Vérifier que le produit existe
    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const user = await User.findById(userId);
    const isFavorite = user.favorites.includes(productId);

    if (isFavorite) {
      user.favorites = user.favorites.filter(
        fav => fav.toString() !== productId
      );
    } else {
      user.favorites.push(productId);
    }

    await user.save();

    res.json({
      success: true,
      isFavorite: !isFavorite,
      message: isFavorite ? 
        'Product removed from favorites' : 
        'Product added to favorites'
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getUserFavorites,
  addToFavorites,
  removeFromFavorites,
  toggleFavorite
};