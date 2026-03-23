const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");

// Global protection removed to allow public /cart/count
// router.use(protect);

// 1. PUBLIC ROUTES (MUST BE BEFORE PROTECTED)
router.get("/cart/count", require("../controllers/cart/getCartCount"));

// 2. USER ROUTERS (PROTECTED)
// Protecting each route individualy except /cart which handles its own
router.use("/", protect, require("./user/profileRoutes")); 

router.use("/wishlist", protect, require("./user/wishlistRoutes"));

router.use("/wallet", protect, require("./user/walletRoutes"));

router.use("/coupons", protect, require("./user/couponRoutes"));

router.use("/addresses", protect, require("./address/addressRoutes"));
router.use("/addresses", protect, require("./address/addressRoutes"));
router.use("/cart", require("./cart/cartRoutes")); // cartRoutes handles protect for other sub-routes
router.use("/orders", protect, require("./order/orderRoutes"));

module.exports = router;