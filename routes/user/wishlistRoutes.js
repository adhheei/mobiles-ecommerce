const express = require("express");
const router = express.Router();
const wishlist = require("../../controllers/wishlist");

// Mounted at /api/user/wishlist
router.get("/", wishlist.getWishlist);
router.post("/", wishlist.addToWishlist);
router.delete("/:productId", wishlist.removeFromWishlist);

module.exports = router;
