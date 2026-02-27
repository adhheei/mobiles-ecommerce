const User = require("../../models/User");
const bcrypt = require("bcryptjs");

// 2. LOGIN
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    if (!user.isVerified) {
      return res
        .status(401)
        .json({ message: "Please verify your email first" });
    }

    if (user.isBlocked) {
      return res
        .status(403)
        .json({ message: "Your account is blocked by admin" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    sendTokenResponse(user, 200, res);
  } catch (err) {
    console.log("Login Error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

module.exports = login;