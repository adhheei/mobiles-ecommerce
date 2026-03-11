const express = require("express");
const router = express.Router();
const { isAdmin } = require("../../middleware/authMiddleware");
const { loginAdmin } = require("../../controllers/auth");
const { getDashboardStats } = require("../../controllers/admin");

router.post("/login", loginAdmin);
router.get("/dashboard-stats", isAdmin, getDashboardStats);

module.exports = router;
