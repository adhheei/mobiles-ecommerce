const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  let token;

  // ✅ Check for token in cookies (preferred) or Authorization header
  if (req.cookies && req.cookies.jwt) {
    token = req.cookies.jwt;
  } else if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Login required",
    });
  }

  try {
    // 4. Verify Token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "supersecretkey",
    );

    // 5. Check if User still exists
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User belonging to this token no longer exists",
      });
    }

    // 6. Check Blocked Status
    if (user.isBlocked) {
      return res.status(403).json({
        success: false,
        message: "Your account is blocked. Please contact support."
      });
    }

    // 7. Grant Access
    req.user = user;
    next();
  } catch (err) {
    console.error("Auth Error:", err.message);
    let message = "Not authorized to access this route";
    if (err.name === "TokenExpiredError") {
      message = "Session expired, please login again";
    } else if (err.name === "JsonWebTokenError") {
      message = "Invalid token";
    }
    return res.status(401).json({
      success: false,
      message,
    });
  }
};


const isAdmin = async (req, res, next) => {
  let token;

  // 1. Check for admin_jwt cookie (preferred for admin)
  if (req.cookies && req.cookies.admin_jwt) {
    token = req.cookies.admin_jwt;
  }
  // 2. Fallback to header (if you want to keep API flexibility)
  else if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Admin login required",
    });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "supersecretkey"
    );

    const user = await User.findById(decoded.id).select("-password");

    if (!user || user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Not authorized as admin",
      });
    }

    req.admin = user; // Attach admin user
    next();
  } catch (err) {
    console.error("Admin Auth Error:", err.message);
    return res.status(401).json({
      success: false,
      message: "Session expired or invalid",
    });
  }
};

module.exports = { protect, isAdmin };
