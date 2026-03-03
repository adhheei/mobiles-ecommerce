const express = require("express");
const router = express.Router();
const { protect, isAdmin } = require("../middleware/authMiddleware");

// ──────────────────────────────────────────────────────────────────────────────
// MODULAR CONTROLLER IMPORTS (Pointed to Folder Hubs)
// ──────────────────────────────────────────────────────────────────────────────
const { loginAdmin } = require("../controllers/auth");
const { getDashboardStats } = require("../controllers/admin");
const category = require("../controllers/category");
const product = require("../controllers/product");
const publicProduct = require("../controllers/publicProduct");
const offer = require("../controllers/offer");
const message = require("../controllers/message");
const coupon = require("../controllers/coupon");
const transaction = require("../controllers/transaction");
const user = require("../controllers/user");
const wallet = require("../controllers/wallet");
const order = require("../controllers/order");
const purchaseController = require("../controllers/admin/purchaseController");

// File Uploads
const {
  single: uploadCategory,
  product: uploadProduct,
} = require("../middleware/upload");

// ROUTES

// AUTH
router.post("/login", loginAdmin);
router.get("/dashboard-stats", isAdmin, getDashboardStats);

// CATEGORY MANAGEMENT
router.get("/categories/public", category.getAllCategories);
router.get("/categories", isAdmin, category.getAllCategories);
router.get("/categories/:id", isAdmin, category.getCategoryById);
router.post("/categories", isAdmin, uploadCategory, category.createCategory);
router.put("/categories/:id", isAdmin, uploadCategory, category.updateCategory);
router.delete("/categories/:id", isAdmin, category.deleteCategory);

// PRODUCT MANAGEMENT (Admin & Public Analytics)
router.get("/products/categories/public", publicProduct.getAllCategories);
router.get("/products/categories-with-counts", product.getCategoriesWithCounts);
router.get("/products/public", publicProduct.getPublicProducts);
router.get("/search/suggestions", publicProduct.getSearchSuggestions);
router.get("/products/brands-with-counts", publicProduct.getBrandsWithCounts);
router.post("/products/suggestions", publicProduct.getSuggestions);

router.get("/products/categories", isAdmin, product.getCategoriesForDropdown);
router.get("/products", isAdmin, product.getAllProducts);
router.post("/products", isAdmin, uploadProduct, product.addProduct);
router.get("/brands", isAdmin, product.getUniqueBrands);
router.get("/products/:id", isAdmin, product.getProductById);
router.put("/products/:id", isAdmin, uploadProduct, product.updateProduct);
router.delete("/products/:id", isAdmin, product.deleteProduct);

// MESSAGE / SUPPORT
router.get("/messages", isAdmin, message.getMessages);
router.patch("/messages/:id/seen", isAdmin, message.markAsSeen);
router.patch("/messages/:id/replied", isAdmin, message.markAsReplied);
router.get("/messages/unread-count", isAdmin, message.getUnreadCount);
router.post("/messages/:id/reply", isAdmin, message.replyToMessage);
router.delete("/messages/:id", isAdmin, message.deleteMessage);

// COUPON MANAGEMENT
router.get("/coupons", isAdmin, coupon.getCoupons);
router.get("/coupons/:id", isAdmin, coupon.getCoupon);
router.post("/coupons", isAdmin, coupon.createCoupon);
router.put("/coupons/:id", isAdmin, coupon.updateCoupon);
router.delete("/coupons/:id", isAdmin, coupon.deleteCoupon);
router.post("/coupons/apply", isAdmin, coupon.applyCoupon);

// TRANSACTIONS & USERS
router.get("/transactions", isAdmin, transaction.getTransactions);
router.get("/transactions/download", isAdmin, transaction.downloadTransactions);
router.get("/users", isAdmin, user.getAllUsers);
router.patch("/users/:id/block", isAdmin, user.toggleBlockUser);
router.get("/wallet/:userId", isAdmin, wallet.adminGetWallet);

// ORDER & RETURN MANAGEMENT
router.get("/orders", isAdmin, order.getAdminOrderDetails);
router.get("/orders/:id", isAdmin, order.getAdminOrderDetails);
router.put("/orders/:id/status", isAdmin, order.updateOrderStatus);
router.patch("/orders/:id/return/:itemId", isAdmin, order.handleReturnRequest);

// OFFER MANAGEMENT
router.get("/offers/hot", offer.getHotDeals);
router.get("/offers", offer.getAllOffers);
router.post("/offers", isAdmin, offer.addOffer);
router.get("/offers/:id", offer.getOfferById);
router.put("/offers/update/:id", isAdmin, offer.updateOffer);
router.delete("/offers/:id", isAdmin, offer.deleteOffer);

// PURCHASE MANAGEMENT
router.post("/purchase/add", isAdmin, purchaseController.addPurchase);
router.get("/purchase/report", isAdmin, purchaseController.getPurchaseReport);

module.exports = router;
