const User = require("../../models/User");
const bcrypt = require("bcryptjs");
const transporter = require("../../utils/emailTransport");

// 1. SEND OTP (For Password Reset)
const sendOtp = async (req, res) => {
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

        // Check Rate Limiting Lock
        if (user.lockUntil && user.lockUntil > Date.now()) {
            return res.status(429).json({ message: "Too many attempts. Try again later." });
        }

        // Generate and Hash 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const salt = await bcrypt.genSalt(10);
        const hashedOtp = await bcrypt.hash(otp, salt);

        // Update User Record
        user.otp = hashedOtp;
        user.otpExpires = Date.now() + 15 * 60 * 1000; // 15 mins
        user.otpAttempts = 0;
        await user.save();

        // Handle Email Delivery
        if (emailOrPhone.includes("@")) {
            const message = `Your Password Reset OTP is: ${otp}\n\nIt expires in 15 minutes.`;

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
            // Mock SMS for Phone
            console.log(`📲 [MOCK SMS] OTP for ${user.phone}: ${otp}`);
            return res.status(200).json({ success: true, message: "OTP sent to phone" });
        }
    } catch (err) {
        console.error("sendOtp Error:", err);
        res.status(500).json({ message: "Server error" });
    }
};

// 2. VERIFY OTP
const verifyOtp = async (req, res) => {
    try {
        const { email, emailOrPhone, otp } = req.body;
        const target = email || emailOrPhone;

        const user = await User.findOne({
            $or: [{ email: target }, { phone: target }],
        });

        if (!user) return res.status(400).json({ message: "User not found" });

        if (user.lockUntil && user.lockUntil > Date.now()) {
            return res.status(429).json({ message: "Too many attempts. Locked." });
        }

        if (!user.otpExpires || user.otpExpires < Date.now()) {
            return res.status(400).json({ message: "OTP has expired" });
        }

        const isMatch = await bcrypt.compare(String(otp), user.otp);

        if (!isMatch) {
            user.otpAttempts += 1;
            if (user.otpAttempts >= 5) {
                user.lockUntil = Date.now() + 15 * 60 * 1000;
            }
            await user.save();
            return res.status(400).json({ message: "Invalid OTP" });
        }

        // If this was a signup verification, mark as verified
        if (!user.isVerified) {
            user.isVerified = true;
            user.otp = undefined;
            user.otpExpires = undefined;
            user.otpAttempts = 0;
            await user.save();
            // In your actual implementation, you might call sendTokenResponse here
            return res.status(200).json({ success: true, message: "Account Verified" });
        }

        // For Password Reset: Extend expiry slightly to allow the next step
        user.otpExpires = Date.now() + 15 * 60 * 1000; 
        await user.save();

        res.status(200).json({ success: true, message: "OTP Verified" });
    } catch (err) {
        console.error("verifyOtp Error:", err);
        res.status(500).json({ message: "Server error" });
    }
};

// 3. RESET PASSWORD
const resetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;

        if (!email || !otp || !newPassword) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        const user = await User.findOne({
            $or: [{ email: email }, { phone: email }],
        });

        if (!user) return res.status(400).json({ message: "User not found" });

        // Security Re-check
        const isMatch = await bcrypt.compare(String(otp), user.otp);
        if (!isMatch || user.otpExpires < Date.now()) {
            return res.status(400).json({ message: "Invalid or expired OTP session" });
        }

        // Update Password and Clear OTP
        user.password = newPassword; 
        user.otp = undefined;
        user.otpExpires = undefined;
        user.otpAttempts = 0;
        user.lockUntil = undefined;

        await user.save();

        res.clearCookie("jwt");
        res.status(200).json({ success: true, message: "Password reset successful" });
    } catch (err) {
        console.error("resetPassword Error:", err);
        res.status(500).json({ message: "Server error" });
    }
};

module.exports = {
    sendOtp,
    verifyOtp,
    resetPassword
}