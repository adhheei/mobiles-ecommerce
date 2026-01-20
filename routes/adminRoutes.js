// routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const path = require('path');

// ────────────────
// CATEGORY ROUTES
// ────────────────

// Import category controller and middleware
const {
  getCategoriesWithCounts
} = require('../controllers/productController');

const {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory
} = require('../controllers/categoryController');

const { single: uploadCategory } = require('../middleware/upload');

// GET all categories
router.get('/categories', getAllCategories);

// GET single category by ID
router.get('/categories/:id', getCategoryById);

// POST new category
router.post('/categories', uploadCategory, createCategory);

// PUT update category
router.put('/categories/:id', uploadCategory, updateCategory);

// DELETE category permanently
router.delete('/categories/:id', deleteCategory);

// GET categories with product counts
router.get('/products/categories-with-counts', getCategoriesWithCounts);

// ────────────────
// PRODUCT ROUTES
// ────────────────

// Import product controller and middleware
const {
  getAllProducts,
  addProduct,
  getCategoriesForDropdown,
  getProductById,
  updateProduct,
  deleteProduct
} = require('../controllers/productController'); // 👈 Fixed: use productController

const { product: uploadProduct } = require('../middleware/upload');

// Public product route (ONLY ONE DEFINITION)
router.get('/products/public', async (req, res) => {
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
});

// GET categories for product dropdown
router.get('/products/categories', getCategoriesForDropdown);

// GET all products (protected admin route)
router.get('/products', getAllProducts);

// POST new product

// GET single product by ID
router.get('/products/:id', getProductById);

// PUT update product
router.put('/products/:id', uploadProduct, updateProduct);

// DELETE product permanently
router.delete('/products/:id', deleteProduct);

module.exports = router;