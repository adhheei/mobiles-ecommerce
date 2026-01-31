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

const publicProductController = require('../controllers/publicProductController');

const {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory
} = require('../controllers/categoryController');

const { loginAdmin } = require('../controllers/authController');

const { single: uploadCategory } = require('../middleware/upload');

// ADMIN LOGIN
router.post('/login', loginAdmin);

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

// Public product route
// Uses the controller to ensure 'draft' status filtering is applied
router.get('/products/public', publicProductController.getPublicProducts);

// Search suggestions route
router.get('/search/suggestions', publicProductController.getSearchSuggestions);

// Get brands with counts
router.get('/products/brands-with-counts', publicProductController.getBrandsWithCounts);

// GET categories for product dropdown
router.get('/products/categories', getCategoriesForDropdown);

// GET all products (protected admin route)
router.get('/products', getAllProducts);

// POST new product
router.post('/products', uploadProduct, addProduct);

// GET single product by ID
router.get('/products/:id', getProductById);

// PUT update product
router.put('/products/:id', uploadProduct, updateProduct);

// DELETE product permanently
router.delete('/products/:id', deleteProduct);

// Signup routes have been moved to authRoutes.js
// ────────────────
// MESSAGE ROUTES
// ────────────────

const { protectAdmin } = require('../middleware/adminAuthMiddleware');
const {
  getMessages,
  markAsRead,
  getUnreadCount
} = require('../controllers/messageController');

// All message routes are protected
router.get('/messages', protectAdmin, getMessages);
router.patch('/messages/:id/seen', protectAdmin, require('../controllers/messageController').markAsSeen);
router.patch('/messages/:id/replied', protectAdmin, require('../controllers/messageController').markAsReplied);
router.get('/messages/unread-count', protectAdmin, getUnreadCount);
// router.post('/messages/:id/reply', protectAdmin, require('../controllers/messageController').replyToMessage);
router.delete('/messages/:id', protectAdmin, require('../controllers/messageController').deleteMessage);

// ────────────────
// COUPON ROUTES
// ────────────────

const {
  createCoupon,
  getCoupons,
  deleteCoupon,
  getCoupon,
  updateCoupon
} = require('../controllers/couponController');

// All coupon routes protected
router.post('/coupons', protectAdmin, createCoupon);
router.get('/coupons', protectAdmin, getCoupons);
router.get('/coupons/:id', protectAdmin, getCoupon);
router.put('/coupons/:id', protectAdmin, updateCoupon);
router.delete('/coupons/:id', protectAdmin, deleteCoupon);

module.exports = router;