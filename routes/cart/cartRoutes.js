const express = require("express");
const router = express.Router();
const cart = require("../../controllers/cart");
const order = require("../../controllers/order");
const razorpay = require("../../controllers/razorpay");
const { protect, optionalProtect } = require("../../middleware/authMiddleware");

if (!protect) {
    console.error("❌ ERROR: 'protect' middleware is undefined. Check authMiddleware.js!");
}

// 1. PUBLIC-FRIENDLY ROUTES (Uses optionalProtect to load user if logged in)
router.get("/count", optionalProtect, cart.getCartCount);

router.use(protect);

// 2. CART MANAGEMENT
router.get("/", cart.getCart);
router.post("/add", cart.addToCart);
router.put("/update", cart.updateCart);
router.delete("/remove/:productId", cart.removeFromCart);
router.delete("/clear", cart.clearCart);

// 2. PAYMENT & CHECKOUT
router.post("/razorpay-order", razorpay.createOrder);
router.post("/checkout", order.placeOrder);

module.exports = router;