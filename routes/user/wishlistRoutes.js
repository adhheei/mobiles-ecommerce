const express = require("express");
const router = express.Router();
const wishlist = require("../../controllers/wishlist");
const { protect } = require("../../middleware/authMiddleware");

// All wishlist routes require authentication
router.use(protect);

// Mounted at /api/wishlist
router.get("/", wishlist.getWishlist);
router.post("/", wishlist.addToWishlist);
router.delete("/:productId", wishlist.removeFromWishlist);

module.exports = router;
