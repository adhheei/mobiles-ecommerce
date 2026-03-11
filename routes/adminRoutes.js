const express = require("express");
const router = express.Router();

// ADMIN ROUTES

router.use("/", require("./admin/authRoutes"));
router.use("/", require("./admin/profileRoutes"));

router.use("/categories", require("./admin/categoryRoutes"));

router.use("/", require("./admin/productRoutes"));

router.use("/messages", require("./admin/messageRoutes"));

router.use("/coupons", require("./admin/couponRoutes"));

router.use("/", require("./admin/userOpsRoutes"));

router.use("/orders", require("./admin/orderRoutes"));

router.use("/offers", require("./admin/offerRoutes"));

router.use("/purchase", require("./admin/purchaseRoutes"));

module.exports = router;
