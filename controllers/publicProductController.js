// controllers/publicProductController.js
const Product = require('../models/Product');
const path = require('path');


exports.getPublicProducts = async (req, res) => {
  try {
    const { page = 1, limit = 12, category, search, sort, inStock, maxPrice } = req.query;
    
    let query = {};
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }
    if (category && category !== 'all') {
      const categoryArray = category.split(',');
      query.category = { $in: categoryArray };
    }
    if (inStock === 'true') {
      query.stock = { $gt: 0 };
    }
    if (maxPrice) {
      query.offerPrice = { $lte: parseInt(maxPrice) };
    }

    let sortObj = {};
    switch(sort) {
      case 'price-low-high':
        sortObj = { offerPrice: 1 };
        break;
      case 'price-high-low':
        sortObj = { offerPrice: -1 };
        break;
      case 'newest':
        sortObj = { createdAt: -1 };
        break;
      default:
        sortObj = { createdAt: -1 };
    }

    const skip = (page - 1) * limit;
    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
      .populate('category', 'name')
      .sort(sortObj)
      .skip(skip)
      .limit(limit);

    const formatted = products.map(p => ({
      id: p._id.toString(),
      name: p.name,
      categoryName: p.category?.name || 'Uncategorized',
      offerPrice: p.offerPrice,
      actualPrice: p.actualPrice,
      stock: p.stock,
      mainImage: p.mainImage ? `/uploads/products/${path.basename(p.mainImage)}` : '/images/logo.jpg'
    }));

    res.json({
      success: true,
      products: formatted,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Failed to fetch products' });
  }
};

// Get categories with product counts for filtering
exports.getCategoriesWithCounts = async (req, res) => {
  try {
    // Get all active categories
    const categories = await Category.find({ isActive: true });
    
    // Get product count for each category (only in-stock products)
    const categoriesWithCounts = await Promise.all(
      categories.map(async (cat) => {
        const productCount = await Product.countDocuments({ 
          category: cat._id,
          stock: { $gt: 0 } // Only count products with stock > 0
        });
        return {
          _id: cat._id.toString(),
          name: cat.name,
          productCount: productCount
        };
      })
    );

    res.json({ success: true, categories: categoriesWithCounts });
  } catch (err) {
    console.error('Error fetching categories with counts:', err);
    res.status(500).json({ success: false, error: 'Failed to load categories' });
  }
};

exports.getPublicProducts = async (req, res) => {
  try {
    const { page = 1, limit = 12, category, search, sort, inStock, maxPrice } = req.query;
    
    // Build query
    let query = {};
    
    // Search by name
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }
    
    // Filter by category (multiple categories supported)
    if (category && category !== 'all') {
      const categoryArray = category.split(',');
      query.category = { $in: categoryArray };
    }
    
    // In-stock only filter
    if (inStock === 'true') {
      query.stock = { $gt: 0 };
    }
    
    // Price range filter
    if (maxPrice) {
      query.offerPrice = { $lte: parseInt(maxPrice) };
    }

    // Build sort object
    let sortObj = {};
    switch(sort) {
      case 'price-low-high':
        sortObj = { offerPrice: 1 };
        break;
      case 'price-high-low':
        sortObj = { offerPrice: -1 };
        break;
      case 'newest':
        sortObj = { createdAt: -1 };
        break;
      case 'best-selling':
      case 'featured':
      default:
        sortObj = { createdAt: -1 };
    }

    const skip = (page - 1) * limit;
    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
      .populate('category', 'name')
      .sort(sortObj)
      .skip(skip)
      .limit(limit);

    // Format response
    const formatted = products.map(p => ({
      id: p._id.toString(),
      name: p.name,
      description: p.description,
      sku: p.sku,
      actualPrice: p.actualPrice,
      offerPrice: p.offerPrice,
      stock: p.stock,
      status: p.status,
      categoryName: p.category?.name || 'Uncategorized',
      mainImage: p.mainImage ? `/uploads/products/${path.basename(p.mainImage)}` : '/images/logo.jpg'
    }));

    res.json({
      success: true,
      products: formatted,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error('Error in getPublicProducts:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch products' });
  }
};