const User = require("../../models/User");
const bcrypt = require("bcryptjs");
const transporter = require("../../utils/emailTransport");

const signup = async (req, res) => {
  try {
    const { firstName, lastName, email, phone, password, confirmPassword } = req.body;

    if (!firstName || !lastName || !email || !phone || !password || !confirmPassword) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    let user = await User.findOne({ email });
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const salt = await bcrypt.genSalt(10);
    const hashedOtp = await bcrypt.hash(otp, salt);

    if (user) {
      if (user.isVerified) return res.status(409).json({ message: "User already exists" });
      
      user.otp = hashedOtp;
      user.otpExpires = Date.now() + 10 * 60 * 1000;
      await user.save();
    } else {
      user = await User.create({
        firstName, lastName, email, phone, password,
        isVerified: false,
        otp: hashedOtp,
        otpExpires: Date.now() + 10 * 60 * 1000,
      });
    }

    // Email Logic
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: "Verify Your Account",
        text: `Your OTP is: ${otp}`,
      });
    } else {
      console.log(`⚠️ [MOCK] OTP: ${otp}`);
    }

    res.status(200).json({ message: "OTP sent to your email" });
  } catch (error) {
    res.status(500).json({ message: "Server error during signup" });
  }
};

module.exports = signup;