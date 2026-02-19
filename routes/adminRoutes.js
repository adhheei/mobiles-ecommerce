// routes/adminRoutes.js
const express = require("express");
const router = express.Router();
const path = require("path");
const { protect, isAdmin } = require("../middleware/authMiddleware");

// ──────────────────────────────────────────────────────────────────────────────
// CONTROLLER IMPORTS
// ──────────────────────────────────────────────────────────────────────────────

// 1. AUTH & ADMIN
const { loginAdmin } = require("../controllers/authController");
const adminController = require("../controllers/adminController");

// 2. CATEGORY
const {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} = require("../controllers/categoryController");

// 3. PRODUCT
const productController = require("../controllers/productController");
const {
  getAllProducts,
  addProduct,
  getCategoriesForDropdown,
  getProductById,
  updateProduct,
  deleteProduct,
  getUniqueBrands,
  getPublicProducts,
  getCategoriesWithCounts,
} = productController;

// 4. OFFERS (FIXED: Assigning to offerController for line 159)
const offerController = require("../controllers/offerController");
const { addOffer, updateOffer, deleteOffer, getAllOffers, getHotDeals } =
  offerController;

// 5. PUBLIC & MESSAGES & COUPONS
const publicProductController = require("../controllers/publicProductController");
const messageController = require("../controllers/messageController");
const {
  applyCoupon,
  createCoupon,
  getCoupons,
  updateCoupon,
  deleteCoupon,
  getCoupon,
} = require("../controllers/couponController");

// 6. TRANSACTIONS, USERS & ORDERS
const {
  getTransactions,
  downloadTransactions,
} = require("../controllers/transactionController");
const {
  getAllUsers,
  toggleBlockUser,
  adminGetWallet,
} = require("../controllers/userController");
const {
  getAdminOrderDetails,
  updateOrderStatus,
  handleReturnRequest,
} = require("../controllers/orderController");

// 7. MIDDLEWARE
const {
  single: uploadCategory,
  product: uploadProduct,
} = require("../middleware/upload");

// ──────────────────────────────────────────────────────────────────────────────
// ROUTES
// ──────────────────────────────────────────────────────────────────────────────

// ADMIN LOGIN
router.post("/login", loginAdmin);

// DASHBOARD
router.get(
  "/dashboard-stats",
  protect,
  isAdmin,
  adminController.getDashboardStats,
);

// CATEGORY ROUTES
router.get("/categories", getAllCategories);
router.get("/categories/:id", getCategoryById);
router.post("/categories", isAdmin, uploadCategory, createCategory);
router.put("/categories/:id", isAdmin, uploadCategory, updateCategory);
router.delete("/categories/:id", isAdmin, deleteCategory);

// PRODUCT ROUTES
router.get("/products/categories-with-counts", getCategoriesWithCounts);
router.get("/products/public", publicProductController.getPublicProducts);
router.get("/search/suggestions", publicProductController.getSearchSuggestions);
router.get(
  "/products/brands-with-counts",
  publicProductController.getBrandsWithCounts,
);
router.post("/products/suggestions", publicProductController.getSuggestions);

router.get("/products/categories", getCategoriesForDropdown);
router.get("/products", getAllProducts);
router.post("/products", isAdmin, uploadProduct, addProduct);
router.get("/brands", getUniqueBrands);
router.get("/public", getPublicProducts);
router.get("/products/:id", getProductById);
router.put("/products/:id", isAdmin, uploadProduct, updateProduct);
router.delete("/products/:id", isAdmin, deleteProduct);

// MESSAGE ROUTES
router.get("/messages", isAdmin, messageController.getMessages);
router.patch("/messages/:id/seen", isAdmin, messageController.markAsSeen);
router.patch("/messages/:id/replied", isAdmin, messageController.markAsReplied);
router.get("/messages/unread-count", isAdmin, messageController.getUnreadCount);
router.post("/messages/:id/reply", isAdmin, messageController.replyToMessage);
router.delete("/messages/:id", isAdmin, messageController.deleteMessage);

// COUPON ROUTES
router.post("/coupons", isAdmin, createCoupon);
router.get("/coupons", isAdmin, getCoupons);
router.get("/coupons/:id", isAdmin, getCoupon);
router.put("/coupons/:id", isAdmin, updateCoupon);
router.delete("/coupons/:id", isAdmin, deleteCoupon);
router.post("/coupons/apply", protect, applyCoupon);

// TRANSACTION & USER & ORDERS
router.get("/transactions", isAdmin, getTransactions);
router.get("/transactions/download", isAdmin, downloadTransactions);
router.get("/users", isAdmin, getAllUsers);
router.patch("/users/:id/block", isAdmin, toggleBlockUser);
router.get("/wallet/:userId", isAdmin, adminGetWallet);
router.get("/orders", isAdmin, getAdminOrderDetails);
router.get("/orders/:id", isAdmin, getAdminOrderDetails);
router.put("/orders/:id/status", isAdmin, updateOrderStatus);
router.patch("/orders/:id/return/:itemId", isAdmin, handleReturnRequest);

// OFFER MANAGEMENT
router.get("/offers", getAllOffers);
router.post("/offers", isAdmin, addOffer);
router.get('/offers/:id', offerController.getOfferById);
router.delete("/offers/:id", isAdmin, deleteOffer);

// LINE 159 FIXED: offerController is now defined
router.put("/offers/update/:id", offerController.updateOffer);

module.exports = router;
