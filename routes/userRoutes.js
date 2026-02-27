const express = require("express");
const router = express.Router();
const user = require("../controllers/user");
const wishlist = require("../controllers/wishlist");
const wallet = require("../controllers/wallet");
const { protect } = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");

router.get("/profile", user.getProfile);
router.put("/profile", user.updateProfile);
router.put("/avatar", upload.single, user.updateAvatar);
router.delete("/avatar", user.removeAvatar);
router.post("/change-password", user.changePassword);

router.get("/wishlist", wishlist.getWishlist);
router.post("/wishlist", wishlist.addToWishlist);
router.delete("/wishlist/:productId", wishlist.removeFromWishlist);


// Wallet Routes
router.get("/wallet", wallet.getWallet);
router.post("/wallet/apply", wallet.applyWallet);

module.exports = router;
