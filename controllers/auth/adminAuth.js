const User = require("../../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

// Simple in-memory storage for login attempts
const loginAttempts = new Map();

/**
 * @desc    Admin Login with rate limiting
 * @route   POST /api/auth/admin/login
 * @access  Public (Admin Only)
 */
const loginAdmin = async (req, res) => {
    try {
        const { email, password } = req.body;
        const ip = req.ip;

        // 1. Rate Limiting Check
        const attempts = loginAttempts.get(ip) || { count: 0, time: Date.now() };
        
        // Reset count if 15 minutes have passed
        if (Date.now() - attempts.time > 15 * 60 * 1000) {
            attempts.count = 0;
            attempts.time = Date.now();
        }

        if (attempts.count >= 5) {
            return res.status(429).json({ error: "Too many attempts. Locked for 15 minutes." });
        }

        // 2. Validation
        if (!email || !password) {
            return res.status(400).json({ error: "Please provide email and password" });
        }

        // 3. User & Role Check
        const user = await User.findOne({ email });
        if (!user || user.role !== "admin") {
            // We increment attempts even if user isn't found to prevent email harvesting
            attempts.count++;
            loginAttempts.set(ip, attempts);
            return res.status(401).json({ error: "Invalid credentials" });
        }

        // 4. Password Verification
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            attempts.count++;
            loginAttempts.set(ip, attempts);
            return res.status(401).json({ error: "Invalid credentials" });
        }

        // 5. Successful Login
        loginAttempts.delete(ip); // Clear attempts on success

        const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, {
            expiresIn: "1d",
        });

        // Set Admin Cookie
        res.cookie("admin_jwt", token, {
            expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
        });

        res.status(200).json({
            success: true,
            token,
            admin: {
                id: user._id,
                email: user.email,
                role: user.role,
            },
        });
    } catch (err) {
        console.error("Admin Login Error:", err);
        res.status(500).json({ error: "Server error during admin login" });
    }
};

module.exports = { loginAdmin };