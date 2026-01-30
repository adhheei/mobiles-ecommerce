const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protectAdmin = async (req, res, next) => {
    let token;

    // 1. Check for token in cookies (preferred) or Authorization header
    if (req.cookies.admin_jwt) {
        token = req.cookies.admin_jwt;
    } else if (req.cookies.jwt) {
        // Fallback to standard jwt if admin_jwt is missing (migration support)
        token = req.cookies.jwt;
    } else if (
        req.headers.authorization &&
        req.headers.authorization.startsWith("Bearer")
    ) {
        token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
        return res.status(401).json({
            success: false,
            message: "Not authorized to access this route (No Token)"
        });
    }

    try {
        // 2. Verify token
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET || "supersecretkey"
        );
        console.log("Token decoded, ID:", decoded.id);

        // 3. Attach admin (user with admin role) to request
        const user = await User.findById(decoded.id);
        if (!user) {
            console.log("User not found for ID:", decoded.id);
            return res.status(401).json({
                success: false,
                message: "Not authorized (User not found)"
            });
        }

        // Check Role
        if (user.role !== 'admin') {
            console.log("Access denied. Not an admin role:", user.role);
            return res.status(403).json({
                success: false,
                message: "Access denied. Admins only."
            });
        }

        req.admin = user; // Keeping req.admin for consistency in other controllers
        next();


    } catch (err) {
        console.error("Auth Middleware Error:", err.message);
        return res.status(401).json({
            success: false,
            message: "Not authorized to access this route (Invalid Token)"
        });
    }
};

module.exports = { protectAdmin };
