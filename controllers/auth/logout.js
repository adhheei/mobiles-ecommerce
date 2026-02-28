const User = require("../../models/User");
const bcrypt = require("bcryptjs");

const logout = (req, res) => {
  // ✅ ONLY clear the user cookie
  res.cookie("token", "none", {
    expires: new Date(Date.now() + 5 * 1000), 
    httpOnly: true,
    path: "/" 
  });

  res.status(200).json({ success: true, message: "User logged out successfully" });
};

module.exports = logout;