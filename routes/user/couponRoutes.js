const express = require("express");
const router = express.Router();
const coupon = require("../../controllers/coupon");

// Mounted at /api/user/coupons
router.get("/", coupon.getAvailableCoupons);
router.post("/apply", coupon.applyCoupon);

module.exports = router;
