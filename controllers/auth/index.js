const signup = require("./signup");
const login = require("./login");
const logout = require("./logout");
const { sendOtp, verifyOtp, resetPassword } = require("./otpController");
const { googleSignup } = require("./googleAuth");
const { loginAdmin } = require("./adminAuth");

module.exports = {
  signup,
  login,
  logout,
  sendOtp,
  verifyOtp,
  resetPassword,
  googleSignup,
  loginAdmin,
};