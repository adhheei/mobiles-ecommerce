const User = require("../../models/User");
const bcrypt = require("bcryptjs");
const transporter = require("../../utils/emailTransport");

const logout = (req, res) => {
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

module.exports = logout;