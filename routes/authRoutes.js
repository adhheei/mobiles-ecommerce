const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

// /api/auth/signup
router.post("/signup", authController.signup);

// /api/auth/login
router.post("/login", authController.login);

// /api/auth/logout
router.post("/logout", authController.logout);

// /api/auth/send-otp (was forgot-password)
router.post("/send-otp", authController.sendOtp);

// /api/auth/verify-otp
router.post("/verify-otp", authController.verifyOtp);

// /api/auth/reset-password
router.post("/reset-password", authController.resetPassword);

// /api/auth/google-signup
router.post("/google-signup", authController.googleSignup);

module.exports = router;
