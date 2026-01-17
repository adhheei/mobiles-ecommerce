// routes/adminRoutes.js
const express = require('express');
const router = express.Router();

// Import category controller and middleware
const {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory
} = require('../controllers/categoryController');

const { single: uploadCategory } = require('../middleware/upload');

// ────────────────
// CATEGORY ROUTES
// ────────────────

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
} = require('../controllers/productController');

const { product: uploadProduct } = require('../middleware/upload');

// GET all products
router.get('/products', getAllProducts);

// POST new product
router.post('/products', uploadProduct, addProduct);

// GET categories for product dropdown
router.get('/products/categories', getCategoriesForDropdown);

// GET single product by ID
router.get('/products/:id', getProductById);

// PUT update product
router.put('/products/:id', uploadProduct, updateProduct);

// DELETE product permanently
router.delete('/products/:id', deleteProduct);

module.exports = router;