const express = require("express");
const router = express.Router();
const cartController = require("../controllers/cartController");
const paymentController = require("../controllers/paymentController");
const { protect } = require("../middleware/authMiddleware");

// Debugging tip: If the server crashes here, protect is undefined
if (!protect) {
  console.error(
    "❌ ERROR: 'protect' middleware is undefined. Check your exports!",
  );
}

// Line 9: Apply protection to all routes below
router.use(protect);

router.get("/", cartController.getCart);
router.get("/count", cartController.getCartCount);
router.post("/add", cartController.addToCart);
router.put("/update", cartController.updateCart);
router.delete("/remove/:productId", cartController.removeFromCart);
router.delete("/clear", cartController.clearCart);

// Payment & Checkout
router.post("/razorpay-order", paymentController.createOrder);
router.post("/checkout", cartController.placeOrder);

module.exports = router;
