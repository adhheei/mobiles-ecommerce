// routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const path = require('path');
const { isAdmin } = require('../middleware/authMiddleware');

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
router.post('/categories', isAdmin, uploadCategory, createCategory);

// PUT update category
router.put('/categories/:id', isAdmin, uploadCategory, updateCategory);

// DELETE category permanently
router.delete('/categories/:id', isAdmin, deleteCategory);

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

// Get suggestions based on cart
router.post('/products/suggestions', publicProductController.getSuggestions);

// GET categories for product dropdown
router.get('/products/categories', getCategoriesForDropdown);

// GET all products (protected admin route)
router.get('/products', getAllProducts);

// POST new product
router.post('/products', isAdmin, uploadProduct, addProduct);

// GET single product by ID
router.get('/products/:id', getProductById); // Public allowed to view ID? usually public route handles this, but admin checks ID too. Let's keep public for now or isAdmin if strictly admin edit page.

// PUT update product
router.put('/products/:id', isAdmin, uploadProduct, updateProduct);

// DELETE product permanently
router.delete('/products/:id', isAdmin, deleteProduct);

// Signup routes have been moved to authRoutes.js
// ────────────────
// MESSAGE ROUTES
// ────────────────

// Import middleware
// const { isAdmin } = require('../middleware/authMiddleware'); // Already imported at top
const {
  getMessages,
  markAsRead,
  getUnreadCount
} = require('../controllers/messageController');

// All message routes are protected
router.get('/messages', isAdmin, getMessages);
router.patch('/messages/:id/seen', isAdmin, require('../controllers/messageController').markAsSeen);
router.patch('/messages/:id/replied', isAdmin, require('../controllers/messageController').markAsReplied);
router.get('/messages/unread-count', isAdmin, getUnreadCount);
// router.post('/messages/:id/reply', isAdmin, require('../controllers/messageController').replyToMessage);
router.post('/messages/:id/reply', isAdmin, require('../controllers/messageController').replyToMessage);
router.delete('/messages/:id', isAdmin, require('../controllers/messageController').deleteMessage);

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
router.post('/coupons', isAdmin, createCoupon);
router.get('/coupons', isAdmin, getCoupons);
router.get('/coupons/:id', isAdmin, getCoupon);
router.put('/coupons/:id', isAdmin, updateCoupon);
router.delete('/coupons/:id', isAdmin, deleteCoupon);

router.delete('/coupons/:id', isAdmin, deleteCoupon);

// ────────────────
// TRANSACTION ROUTES
// ────────────────
const { getTransactions, downloadTransactions } = require('../controllers/transactionController');

router.get('/transactions', isAdmin, getTransactions);
router.get('/transactions/download', isAdmin, downloadTransactions);

// ────────────────
// USER ROUTES
// ────────────────
const { getAllUsers, toggleBlockUser, adminGetWallet, adminUpdateWallet } = require('../controllers/userController');

router.get('/users', isAdmin, getAllUsers);
router.patch('/users/:id/block', isAdmin, toggleBlockUser);

// Admin Wallet Routes
router.get('/wallet/:userId', isAdmin, adminGetWallet);
// ────────────────
// ORDER ROUTES (ADMIN)
// ────────────────
const { getAdminOrderDetails, updateOrderStatus } = require('../controllers/orderController');

router.get('/orders/:id', isAdmin, getAdminOrderDetails);
router.put('/orders/:id/status', isAdmin, updateOrderStatus);

module.exports = router;