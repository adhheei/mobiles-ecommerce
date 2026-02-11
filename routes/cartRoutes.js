const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const paymentController = require("../controllers/paymentController");
const { protect } = require('../middleware/authMiddleware');

// All routes are protected
router.use(protect);

router.get('/', cartController.getCart);
router.get('/count', cartController.getCartCount);
router.post('/add', cartController.addToCart);
router.put('/update', cartController.updateCart);
router.delete('/remove/:productId', cartController.removeFromCart);
router.delete('/clear', cartController.clearCart);
router.post('/checkout', cartController.placeOrder);
router.post("/razorpay-order", protect, paymentController.createOrder);
router.post("/checkout", protect, cartController.placeOrder);

module.exports = router;
