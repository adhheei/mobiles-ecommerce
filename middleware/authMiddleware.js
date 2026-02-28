const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  let token;

  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
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
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "supersecretkey",
    );

    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User belonging to this token no longer exists",
      });
    }

    if (user.isBlocked) {
      return res.status(403).json({
        success: false,
        message: "Your account is blocked. Please contact support.",
      });
    }

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

  if (req.cookies && req.cookies.admin_jwt) {
    token = req.cookies.admin_jwt;
  } else if (
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
      process.env.JWT_SECRET || "supersecretkey",
    );

    const user = await User.findById(decoded.id).select("-password");

    if (!user || user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Not authorized as admin",
      });
    }

    req.admin = user;
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
