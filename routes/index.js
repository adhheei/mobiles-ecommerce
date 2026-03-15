const express = require("express");
const router = express.Router();

// MAIN API ROUTER

router.use("/auth", require("./auth/authRoutes"));
router.use("/admin", require("./adminRoutes"));
router.use("/user", require("./userRoutes"));
router.use("/contact", require("./contact/contactRoutes"));

module.exports = router;
