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

    // 6. Grant Access
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

module.exports = { protect };
