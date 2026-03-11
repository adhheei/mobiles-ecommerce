const express = require("express");
const router = express.Router();
const { isAdmin } = require("../../middleware/authMiddleware");
const coupon = require("../../controllers/coupon");

// Mounted at /api/admin/coupons
router.get("/", isAdmin, coupon.getCoupons);
router.get("/:id", isAdmin, coupon.getCoupon);
router.post("/", isAdmin, coupon.createCoupon);
router.put("/:id", isAdmin, coupon.updateCoupon);
router.delete("/:id", isAdmin, coupon.deleteCoupon);
router.post("/apply", isAdmin, coupon.applyCoupon);

module.exports = router;
