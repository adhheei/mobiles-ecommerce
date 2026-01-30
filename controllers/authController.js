
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const nodemailer = require("nodemailer");
const crypto = require("crypto");

const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// 📧 Email Configuration
const transporter = nodemailer.createTransport({
  service: "gmail", // Use your email provider
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Helper: Send Token Response
const sendTokenResponse = (model, statusCode, res) => {
  const token = jwt.sign({ id: model._id }, JWT_SECRET, {
    expiresIn: "30d",
  });

  const options = {
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    httpOnly: true,
    // secure: true // Enable in production with HTTPS
  };

  if (process.env.NODE_ENV === "production") {
    options.secure = true;
  }

  res.status(statusCode).cookie("jwt", token, options).json({
    success: true,
    token,
    user: {
      id: model._id,
      name: model.firstName || "Admin",
      email: model.email,
    },
  });
};

// 1. REGISTER USER
exports.signup = async (req, res) => {
  try {
    const { firstName, lastName, email, phone, password, confirmPassword } =
      req.body;

    if (
      !firstName ||
      !lastName ||
      !email ||
      !phone ||
      !password ||
      !confirmPassword
    ) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    const existingUser = await User.findOne({
      $or: [{ email }, { phone }],
    });

    if (existingUser) {
      return res
        .status(409)
        .json({ message: "User already exists with this email or phone" });
    }

    const user = await User.create({
      firstName,
      lastName,
      email,
      phone,
      password,
    });

    sendTokenResponse(user, 201, res);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// 2. LOGIN USER
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Please provide valid credentials" });
    }

    // Check for user
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (user.status === "blocked") {
      return res.status(403).json({ message: "Account is blocked. Contact support." });
    }

    sendTokenResponse(user, 200, res);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// 3. LOGOUT
exports.logout = (req, res) => {
  res.cookie("jwt", "none", {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.cookie("admin_jwt", "none", {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  res.status(200).json({ success: true, message: "Logged out successfully" });
};

// 4. SEND OTP (Email or Phone)
exports.sendOtp = async (req, res) => {
  try {
    const { emailOrPhone } = req.body;

    if (!emailOrPhone) {
      return res.status(400).json({ message: "Please provide Email or Phone" });
    }

    // Find user by email OR phone
    const user = await User.findOne({
      $or: [{ email: emailOrPhone }, { phone: emailOrPhone }]
    });

    if (!user) {
      // Security: Fake success to prevent enumeration, or return 404 if UX > Security
      // For this project, we'll return 404 for clarity
      return res.status(404).json({ message: "User not found" });
    }

    // Check Lock
    if (user.lockUntil && user.lockUntil > Date.now()) {
      return res.status(429).json({ message: "Too many attempts. Please try again later." });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Securely Hash OTP
    const salt = await bcrypt.genSalt(10);
    const hashedOtp = await bcrypt.hash(otp, salt);

    // Update User
    user.otp = hashedOtp;
    user.otpExpires = Date.now() + 5 * 60 * 1000; // 5 mins
    user.otpAttempts = 0; // Reset attempts on new OTP
    await user.save();

    // Determine if Email or Phone
    const isEmail = emailOrPhone.includes("@");

    if (isEmail) {
      // Send Email
      const message = `Your Password Reset OTP is: ${otp}\n\nIt expires in 5 minutes.`;

      if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.log("⚠️ [MOCK EMAIL] OTP for " + user.email + ": " + otp);
        return res.status(200).json({ success: true, message: "OTP sent (Mock Mode check console)" });
      }

      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: "Password Reset OTP - Jinsa Mobiles",
        text: message,
      });

      res.status(200).json({ success: true, message: "OTP sent to email" });
    } else {
      // Send Phone (Mock)
      console.log("📲 [MOCK SMS] OTP for " + user.phone + ": " + otp);
      res.status(200).json({ success: true, message: "OTP sent to phone" });
    }

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// 5. VERIFY OTP
exports.verifyOtp = async (req, res) => {
  try {
    const { emailOrPhone, otp } = req.body;

    const user = await User.findOne({
      $or: [{ email: emailOrPhone }, { phone: emailOrPhone }]
    });

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    // Check Lock
    if (user.lockUntil && user.lockUntil > Date.now()) {
      return res.status(429).json({ message: "Too many attempts. Try again later." });
    }

    // Check Expiry
    if (!user.otpExpires || user.otpExpires < Date.now()) {
      return res.status(400).json({ message: "OTP has expired" });
    }

    // Verify OTP
    const isMatch = await bcrypt.compare(otp, user.otp);

    if (!isMatch) {
      user.otpAttempts += 1;
      if (user.otpAttempts >= 5) {
        user.lockUntil = Date.now() + 15 * 60 * 1000; // Lock for 15 mins
        await user.save();
        return res.status(429).json({ message: "Too many failed attempts. Locked for 15 mins." });
      }
      await user.save();
      return res.status(400).json({ message: "Invalid OTP" });
    }

    // Success (Don't clear yet, clear on reset)
    // Optionally return a temporary token here if stateless
    res.status(200).json({ success: true, message: "OTP Verified" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// 6. RESET PASSWORD
exports.resetPassword = async (req, res) => {
  try {
    const { emailOrPhone, otp, password } = req.body;

    const user = await User.findOne({
      $or: [{ email: emailOrPhone }, { phone: emailOrPhone }]
    });

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    // Re-verify OTP (Critical Security)
    if (!user.otpExpires || user.otpExpires < Date.now()) {
      return res.status(400).json({ message: "OTP expired, please request new one" });
    }

    const isMatch = await bcrypt.compare(otp, user.otp);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    // Update password
    user.password = password;
    user.otp = undefined;
    user.otpExpires = undefined;
    user.otpAttempts = 0;
    user.lockUntil = undefined;

    await user.save();

    sendTokenResponse(user, 200, res);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// 7. GOOGLE SIGNUP/LOGIN
exports.googleSignup = async (req, res) => {
  try {
    const { credential } = req.body;

    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, given_name, family_name } = payload;

    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        firstName: given_name,
        lastName: family_name || "",
        email,
        phone: "google-" + Date.now(), // Placeholder
        password: email + process.env.JWT_SECRET, // Dummy securely hashed
        isGoogleUser: true,
      });
    }

    sendTokenResponse(user, 200, res);
  } catch (error) {
    console.error(error);
    res.status(401).json({
      success: false,
      message: "Invalid Google token",
    });
  }
};

// In-memory rate limiter (simple implementation)
const loginAttempts = new Map();

// 8. ADMIN LOGIN
exports.loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const ip = req.ip;

    // Check Rate Limit (5 attempts per 15 mins)
    const attempts = loginAttempts.get(ip) || { count: 0, time: Date.now() };
    if (Date.now() - attempts.time > 15 * 60 * 1000) {
      attempts.count = 0;
      attempts.time = Date.now();
    }
    if (attempts.count >= 5) {
      return res.status(429).json({ success: false, error: "Too many login attempts. Please try again later." });
    }

    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, error: "Please provide email and password" });
    }

    // Check User model instead of Admin
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(401)
        .json({ success: false, error: "Invalid credentials" });
    }

    // Check Role
    if (user.role !== 'admin') {
      return res
        .status(403)
        .json({ success: false, error: "Access denied. Not an admin." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      // Increment attempts
      attempts.count++;
      loginAttempts.set(ip, attempts);
      return res
        .status(401)
        .json({ success: false, error: "Invalid credentials" });
    }

    // Reset attempts on success
    loginAttempts.delete(ip);

    // Generate Token
    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: "1d" });

    // Cookie for admin
    res.cookie("admin_jwt", token, {
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      httpOnly: true,
      secure: process.env.NODE_ENV === "production"
    }).json({
      success: true,
      token,
      admin: {
        id: user._id,
        email: user.email,
        role: user.role
      },
    });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ success: false, error: "Server error" });
  }
};

