const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/authMiddleware');
const order = require('../../controllers/order');

router.use(protect);

router.get('/', order.getMyOrders);
router.get('/:id', order.getOrderDetails);

router.put('/:id/cancel', order.cancelOrder);
router.post('/:id/return/:itemId', order.requestReturn);

router.get('/download-invoice/:orderId', order.downloadInvoice);

module.exports = router;