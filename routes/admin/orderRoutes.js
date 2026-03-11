const express = require("express");
const router = express.Router();
const { isAdmin } = require("../../middleware/authMiddleware");
const order = require("../../controllers/order");

// Mounted at /api/admin/orders
router.get("/", isAdmin, order.getAdminOrderDetails);
router.get("/:id", isAdmin, order.getAdminOrderDetails);
router.put("/:id/status", isAdmin, order.updateOrderStatus);
router.patch("/:id/return/:itemId", isAdmin, order.handleReturnRequest);

module.exports = router;
