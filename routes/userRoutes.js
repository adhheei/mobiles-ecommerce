const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");

router.use(protect);

// USER ROUTERS

router.use("/", require("./user/profileRoutes")); 

router.use("/wishlist", require("./user/wishlistRoutes"));

router.use("/wallet", require("./user/walletRoutes"));

router.use("/coupons", require("./user/couponRoutes"));

// Consistently mounted user-specific routes
router.use("/addresses", require("./address/addressRoutes"));
router.use("/cart", require("./cart/cartRoutes"));
router.use("/orders", require("./order/orderRoutes"));

module.exports = router;