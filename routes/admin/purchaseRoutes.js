const express = require("express");
const router = express.Router();
const { isAdmin } = require("../../middleware/authMiddleware");
const purchaseController = require("../../controllers/admin/purchaseController");
const updatePurchase = require("../../controllers/admin/updatePurchase");

// Mounted at /api/admin/purchase
router.post("/add", isAdmin, purchaseController.addPurchase);
router.get("/report", isAdmin, purchaseController.getPurchaseReport);
router.put("/update/:id", isAdmin, updatePurchase.updatePurchase);

module.exports = router;
