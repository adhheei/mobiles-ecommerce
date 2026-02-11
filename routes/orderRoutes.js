const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
    getMyOrders,
    getOrderDetails,
    cancelOrder,
    requestReturn
} = require('../controllers/orderController');

router.get('/', protect, getMyOrders);
router.get('/:id', protect, getOrderDetails);
router.put('/:id/cancel', protect, cancelOrder);
router.post('/:id/return/:itemId', protect, requestReturn);

module.exports = router;
