const express = require("express");
const router = express.Router();
const {
    getProfile,
    updateProfile,
    updateAvatar,
    getWishlist,
    addToWishlist,
    removeFromWishlist
} = require("../controllers/userController");
const { getAvailableCoupons } = require("../controllers/couponController");
const { protect } = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");

router.get("/profile", protect, getProfile);
router.put("/profile", protect, updateProfile);
router.put("/avatar", protect, upload.single, updateAvatar);

router.get("/wishlist", protect, getWishlist);
router.post("/wishlist", protect, addToWishlist);
router.delete("/wishlist/:productId", protect, removeFromWishlist);

router.get("/coupons", protect, getAvailableCoupons);

router.post("/change-password", authMiddleware, changePassword);

module.exports = router;
