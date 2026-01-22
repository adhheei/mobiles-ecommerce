// controllers/publicProductController.js
const Product = require('../models/Product');
const Category = require('../models/Category');
const path = require('path');




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
          stock: { $gt: 0 },
          status: 'active'
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
    const { page = 1, limit = 12, category, brand, search, sort, inStock, maxPrice } = req.query;

    // Build query
    // Build query
    let query = {
      status: { $in: ['active', 'outofstock'] }
    };

    // Search by name
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    // Filter by category (multiple categories supported)
    if (category && category !== 'all') {
      const categoryArray = category.split(',');
      query.category = { $in: categoryArray };
    }

    // Filter by brand (multiple brands supported)
    if (brand && brand !== 'all') {
      const brandArray = brand.split(',');
      // Create case-insensitive regex for each brand
      const brandRegexArray = brandArray.map(b => new RegExp(`^${b}$`, 'i'));
      query.brand = { $in: brandRegexArray };
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
    switch (sort) {
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
      stock: p.stock,
      status: p.status,
      brand: p.brand || 'Generic',
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

exports.getBrandsWithCounts = async (req, res) => {
  try {
    const brands = await Product.aggregate([
      { $match: { status: { $in: ['active', 'outofstock'] } } },
      {
        $group: {
          _id: { $toLower: "$brand" }, // Group by lowercase brand to normalize
          originalName: { $first: "$brand" }, // Keep one original casing
          count: { $sum: 1 }
        }
      },
      { $sort: { originalName: 1 } }
    ]);

    // Map to cleaner format, handle Generic/null
    const formattedBrands = brands.map(b => ({
      name: b.originalName || 'Generic',
      count: b.count,
      id: b.originalName // Use name as ID for simplicity in frontend
    }));

    res.json({ success: true, brands: formattedBrands });
  } catch (err) {
    console.error('Error fetching brands:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch brands' });
  }
};

exports.getSearchSuggestions = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 1) {
      return res.json({ success: true, suggestions: [] });
    }

    const regex = new RegExp(q, 'i');

    // Search active products
    const products = await Product.find({
      $or: [{ name: regex }, { description: regex }],
      status: { $in: ['active', 'outofstock'] } // Exclude drafts
    })
      .select('name _id mainImage category brand')
      .populate('category', 'name')
      .limit(5);

    // Search categories
    const categories = await Category.find({
      name: regex
    }).select('name _id').limit(3);

    const suggestions = [];

    categories.forEach(cat => {
      suggestions.push({
        type: 'category',
        label: cat.name,
        id: cat._id,
        url: `./productPage.html?category=${cat._id}`
      });
    });

    products.forEach(prod => {
      suggestions.push({
        type: 'product',
        label: prod.name,
        image: prod.mainImage ? `/uploads/products/${path.basename(prod.mainImage)}` : '/images/logo.jpg',
        id: prod._id,
        url: `./singleProductPage.html?id=${prod._id}`
      });
    });

    res.json({ success: true, suggestions });
  } catch (err) {
    console.error('Error in getSearchSuggestions:', err);
    res.status(500).json({ success: false, error: 'Search failed' });
  }
};