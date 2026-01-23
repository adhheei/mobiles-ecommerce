const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

// /api/auth/signup
router.post("/signup", authController.signup);

// /api/auth/google-signup
router.post("/google-signup", authController.googleSignup);

module.exports = router;
