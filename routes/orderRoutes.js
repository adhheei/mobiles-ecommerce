const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
    getMyOrders,
    getOrderDetails,
    cancelOrder
} = require('../controllers/orderController');

router.get('/', protect, getMyOrders);
router.get('/:id', protect, getOrderDetails);
router.put('/:id/cancel', protect, cancelOrder);

module.exports = router;
