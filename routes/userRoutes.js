const express = require("express");
const router = express.Router();
const {
    getProfile,
    updateProfile,
    updateAvatar,
    removeAvatar,
    getWishlist,
    addToWishlist,
    removeFromWishlist,
    changePassword,
    getWallet,
    applyWallet
} = require("../controllers/userController");
const { getAvailableCoupons, applyCoupon } = require("../controllers/couponController");
const { protect } = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");

router.get("/profile", protect, getProfile);
router.put("/profile", protect, updateProfile);
router.put("/avatar", protect, upload.single, updateAvatar);
router.delete("/avatar", protect, removeAvatar);

router.get("/wishlist", protect, getWishlist);
router.post("/wishlist", protect, addToWishlist);
router.delete("/wishlist/:productId", protect, removeFromWishlist);

router.get("/coupons", protect, getAvailableCoupons);
router.post("/coupons/apply", protect, applyCoupon);

router.post("/change-password", protect, changePassword);

// Wallet Routes
router.get("/wallet", protect, getWallet);
router.post("/wallet/apply", protect, applyWallet);

module.exports = router;
