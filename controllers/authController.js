const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const nodemailer = require("nodemailer");

const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/*
  -------------------------------------------------------------------------
  📧 EMAIL TRANSPORT CONFIGURATION
  -------------------------------------------------------------------------
*/
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/*
  -------------------------------------------------------------------------
  🛠️ HELPER FUNCTIONS
  -------------------------------------------------------------------------
*/

// Generate JWT & Send Cookie
const sendTokenResponse = (model, statusCode, res) => {
  const token = jwt.sign(
    { id: model._id, role: model.role },
    JWT_SECRET,
    { expiresIn: "30d" }
  );

  const options = {
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  };

  res
    .status(statusCode)
    .cookie("jwt", token, options)
    .json({
      success: true,
      token,
      user: {
        id: model._id,
        firstName: model.firstName,
        lastName: model.lastName,
        email: model.email,
        role: model.role,
      },
    });
};

/*
  -------------------------------------------------------------------------
  🛂 AUTH CONTROLLERS
  -------------------------------------------------------------------------
*/

// 1. SIGNUP
exports.signup = async (req, res) => {
  try {
    const { firstName, lastName, email, phone, password, confirmPassword } = req.body;

    if (!firstName || !lastName || !email || !phone || !password || !confirmPassword) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
    if (existingUser) {
      return res.status(409).json({ message: "User already exists" });
    }

    const user = await User.create({
      firstName,
      lastName,
      email,
      phone,
      password, // Pre-save hook will hash this
    });

    sendTokenResponse(user, 201, res);
  } catch (error) {
    console.error("Signup Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// 2. LOGIN
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    sendTokenResponse(user, 200, res); // Use helper function

  } catch (err) {
    console.log("Login Error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// 3. LOGOUT
exports.logout = (req, res) => {
  res.cookie("jwt", "none", {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  // Clear admin cookie too just in case
  res.cookie("admin_jwt", "none", {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  res.status(200).json({ success: true, message: "Logged out successfully" });
};

// 4. SEND OTP
exports.sendOtp = async (req, res) => {
  try {
    const { emailOrPhone } = req.body;
    if (!emailOrPhone) {
      return res.status(400).json({ message: "Please provide Email or Phone" });
    }

    const user = await User.findOne({
      $or: [{ email: emailOrPhone }, { phone: emailOrPhone }],
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check Lock
    if (user.lockUntil && user.lockUntil > Date.now()) {
      return res.status(429).json({ message: "Too many attempts. Try again later." });
    }

    // Generate 6-digit numeric OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Hash OTP
    const salt = await bcrypt.genSalt(10);
    const hashedOtp = await bcrypt.hash(otp, salt);

    // Update User
    user.otp = hashedOtp;
    user.otpExpires = Date.now() + 5 * 60 * 1000; // 5 mins
    user.otpAttempts = 0;
    await user.save();

    // Send Email
    if (emailOrPhone.includes("@")) {
      const message = `Your Password Reset OTP is: ${otp}\n\nIt expires in 5 minutes.`;

      // Mock Check
      if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.log(`⚠️ [MOCK EMAIL] OTP for ${user.email}: ${otp}`);
        return res.status(200).json({ success: true, message: "OTP sent (Mock Mode)" });
      }

      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: "Password Reset OTP - Jinsa Mobiles",
        text: message,
      });

      return res.status(200).json({ success: true, message: "OTP sent to email" });
    } else {
      // Mock SMS
      console.log(`📲 [MOCK SMS] OTP for ${user.phone}: ${otp}`);
      return res.status(200).json({ success: true, message: "OTP sent to phone" });
    }
  } catch (err) {
    console.error("sendOtp Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// 5. VERIFY OTP
exports.verifyOtp = async (req, res) => {
  try {
    const { emailOrPhone, otp } = req.body;

    const user = await User.findOne({
      $or: [{ email: emailOrPhone }, { phone: emailOrPhone }],
    });

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    // Check Lock
    if (user.lockUntil && user.lockUntil > Date.now()) {
      return res.status(429).json({ message: "Too many attempts. Locked." });
    }

    // Check Expiry
    if (!user.otpExpires || user.otpExpires < Date.now()) {
      return res.status(400).json({ message: "OTP has expired" });
    }

    // Verify Match (Explicit String Cast)
    const isMatch = await bcrypt.compare(String(otp), user.otp);

    if (!isMatch) {
      user.otpAttempts += 1;
      if (user.otpAttempts >= 5) {
        user.lockUntil = Date.now() + 15 * 60 * 1000; // 15 min lock
        await user.save();
        return res.status(429).json({ message: "Locked for 15 minutes due to too many failed attempts." });
      }
      await user.save();
      return res.status(400).json({ message: "Invalid OTP" });
    }

    // Success - Do NOT clear OTP yet (needed for reset step)
    res.status(200).json({ success: true, message: "OTP Verified" });
  } catch (err) {
    console.error("verifyOtp Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// 6. RESET PASSWORD
exports.resetPassword = async (req, res) => {
  try {
    // Expect: email, otp, newPassword
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: "Missing required fields (email, otp, newPassword)" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 chars" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    // Re-Verify OTP (Security)
    if (!user.otpExpires || user.otpExpires < Date.now()) {
      return res.status(400).json({ message: "OTP has expired" });
    }

    // Explicit string cast
    const isMatch = await bcrypt.compare(String(otp), user.otp);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    // Set New Password
    user.password = newPassword;

    // Clear OTP fields
    user.otp = undefined;
    user.otpExpires = undefined;
    user.otpAttempts = 0;
    user.lockUntil = undefined;

    await user.save();

    // Clear Auth Cookie to force re-login
    res.clearCookie("jwt");
    res.clearCookie("admin_jwt");

    res.status(200).json({
      success: true,
      message: "Password reset successfully. Please login."
    });

  } catch (err) {
    console.error("resetPassword Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// 7. GOOGLE AUTH
exports.googleSignup = async (req, res) => {
  try {
    const { credential } = req.body;
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const { email, given_name, family_name } = ticket.getPayload();

    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        firstName: given_name,
        lastName: family_name || "",
        email,
        phone: "google-" + Date.now(),
        password: email + process.env.JWT_SECRET,
        isGoogleUser: true,
      });
    }
    sendTokenResponse(user, 200, res);
  } catch (error) {
    res.status(401).json({ success: false, message: "Invalid Google token" });
  }
};

// 8. ADMIN LOGIN
const loginAttempts = new Map();
exports.loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const ip = req.ip;

    const attempts = loginAttempts.get(ip) || { count: 0, time: Date.now() };
    if (Date.now() - attempts.time > 15 * 60 * 1000) attempts.count = 0;

    if (attempts.count >= 5) {
      return res.status(429).json({ error: "Too many attempts" });
    }

    if (!email || !password) {
      return res.status(400).json({ error: "Missing credentials" });
    }

    const user = await User.findOne({ email });
    if (!user || user.role !== "admin") {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      attempts.count++;
      loginAttempts.set(ip, attempts);
      return res.status(401).json({ error: "Invalid credentials" });
    }

    loginAttempts.delete(ip);

    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: "1d" });
    res.cookie("admin_jwt", token, {
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      httpOnly: true,
      secure: process.env.NODE_ENV === "production"
    }).json({
      success: true,
      token,
      admin: { id: user._id, email: user.email, role: user.role }
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};
