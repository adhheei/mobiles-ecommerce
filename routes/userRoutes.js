const express = require("express");
const router = express.Router();
const user = require("../controllers/user");
const wishlist = require("../controllers/wishlist");
const wallet = require("../controllers/wallet");
const { protect } = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");
const Coupon = require("../models/Coupon");
const coupon = require("../controllers/coupon");

router.use(protect);

// 1. PROFILE MANAGEMENT
router.get("/profile", user.getProfile);
router.put("/profile", user.updateProfile);
router.put("/avatar", upload.single, user.updateAvatar);
router.delete("/avatar", user.removeAvatar);
router.post("/change-password", user.changePassword);

// 2. WISHLIST MANAGEMENT
router.get("/wishlist", wishlist.getWishlist);
router.post("/wishlist", wishlist.addToWishlist);
router.delete("/wishlist/:productId", wishlist.removeFromWishlist);

// 3. WALLET MANAGEMENT
router.get("/wallet", wallet.getWallet);
router.post("/wallet/apply", wallet.applyWallet);

// 4. Coupon MANAGEMENT
router.get("/coupons", coupon.getAvailableCoupons);
router.post("/coupons/apply", coupon.applyCoupon);

module.exports = router;