// routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const path = require('path');
const { isAdmin } = require('../middleware/authMiddleware');

// ────────────────
// CONTROLLER IMPORTS
// ────────────────

// 1. IMPORT AUTH
const { loginAdmin } = require('../controllers/authController');

// 2. IMPORT CATEGORY
const {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory
} = require('../controllers/categoryController');

// 3. IMPORT PRODUCT (The main fix is here)
// We assign the entire object to 'productController' so your calls below work
const productController = require('../controllers/productController');
const {
  getAllProducts,
  addProduct,
  getCategoriesForDropdown,
  getProductById,
  updateProduct,
  deleteProduct,
  getUniqueBrands, // You can still destructure these for direct use
  getPublicProducts,
  getCategoriesWithCounts
} = productController;

// 4. IMPORT PUBLIC & OTHERS
const publicProductController = require('../controllers/publicProductController');
const { single: uploadCategory, product: uploadProduct } = require('../middleware/upload');

// ────────────────
// ADMIN LOGIN
// ────────────────
router.post('/login', loginAdmin);

// ────────────────
// CATEGORY ROUTES
// ────────────────
router.get('/categories', getAllCategories);
router.get('/categories/:id', getCategoryById);
router.post('/categories', isAdmin, uploadCategory, createCategory);
router.put('/categories/:id', isAdmin, uploadCategory, updateCategory);
router.delete('/categories/:id', isAdmin, deleteCategory);

// Note: Ensure this exists in productController
router.get('/products/categories-with-counts', getCategoriesWithCounts);

// ────────────────
// PRODUCT ROUTES
// ────────────────

// Public product routes (Using publicProductController)
router.get('/products/public', publicProductController.getPublicProducts);
router.get('/search/suggestions', publicProductController.getSearchSuggestions);
router.get('/products/brands-with-counts', publicProductController.getBrandsWithCounts);
router.post('/products/suggestions', publicProductController.getSuggestions);

// Admin/Internal Product Routes
router.get('/products/categories', getCategoriesForDropdown);
router.get('/products', getAllProducts);
router.post('/products', isAdmin, uploadProduct, addProduct);

// FIXED: These were calling 'productController' which wasn't defined properly before
router.get('/brands', getUniqueBrands);
router.get('/public', getPublicProducts);

router.get('/products/:id', getProductById);
router.put('/products/:id', isAdmin, uploadProduct, updateProduct);
router.delete('/products/:id', isAdmin, deleteProduct);

// ────────────────
// MESSAGE ROUTES
// ────────────────
const messageController = require('../controllers/messageController');
router.get('/messages', isAdmin, messageController.getMessages);
router.patch('/messages/:id/seen', isAdmin, messageController.markAsSeen);
router.patch('/messages/:id/replied', isAdmin, messageController.markAsReplied);
router.get('/messages/unread-count', isAdmin, messageController.getUnreadCount);
router.post('/messages/:id/reply', isAdmin, messageController.replyToMessage);
router.delete('/messages/:id', isAdmin, messageController.deleteMessage);

// ────────────────
// COUPON ROUTES
// ────────────────
const couponController = require('../controllers/couponController');
router.post('/coupons', isAdmin, couponController.createCoupon);
router.get('/coupons', isAdmin, couponController.getCoupons);
router.get('/coupons/:id', isAdmin, couponController.getCoupon);
router.put('/coupons/:id', isAdmin, couponController.updateCoupon);
router.delete('/coupons/:id', isAdmin, couponController.deleteCoupon);

// ────────────────
// TRANSACTION & USER & ORDERS
// ────────────────
const { getTransactions, downloadTransactions } = require('../controllers/transactionController');
const { getAllUsers, toggleBlockUser, adminGetWallet } = require('../controllers/userController');
const { getAdminOrderDetails, updateOrderStatus } = require('../controllers/orderController');

router.get('/transactions', isAdmin, getTransactions);
router.get('/transactions/download', isAdmin, downloadTransactions);
router.get('/users', isAdmin, getAllUsers);
router.patch('/users/:id/block', isAdmin, toggleBlockUser);
router.get('/wallet/:userId', isAdmin, adminGetWallet);
router.get('/orders', isAdmin, getAdminOrderDetails);
router.get('/orders/:id', isAdmin, getAdminOrderDetails);
router.put('/orders/:id/status', isAdmin, updateOrderStatus);

module.exports = router;