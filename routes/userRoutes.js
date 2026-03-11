const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");

router.use(protect);

// USER ROUTERS

router.use("/", require("./user/profileRoutes")); 

router.use("/wishlist", require("./user/wishlistRoutes"));

router.use("/wallet", require("./user/walletRoutes"));

router.use("/coupons", require("./user/couponRoutes"));

module.exports = router;