const express = require("express");
const router = express.Router();
const auth = require("../controllers/auth");

// 1. REGISTRATION & LOGIN
router.post("/signup", auth.signup);
router.post("/login", auth.login);
router.post("/logout", auth.logout);

// 2. OTP MANAGEMENT (Signup & Forgot Password)
router.post("/send-otp", auth.sendOtp);
router.post("/verify-otp", auth.verifyOtp);
router.post("/resend-otp", auth.sendOtp); // Reuses sendOtp logic

// 3. PASSWORD RECOVERY
router.post("/reset-password", auth.resetPassword);

// 4. SOCIAL AUTHENTICATION
router.post('/google-signup', auth.googleSignup);

module.exports = router;