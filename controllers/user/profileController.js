const User = require("../../models/User");

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select(
      "firstName lastName email phone profileImage",
    );
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    res.status(200).json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, phone } = req.body;
    const user = await User.findById(req.user._id);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    if (phone && phone !== user.phone) {
      const phoneExists = await User.findOne({ phone });
      if (phoneExists)
        return res
          .status(400)
          .json({ success: false, message: "Mobile number already in use" });
      user.phone = phone;
    }

    if (firstName) user.firstName = firstName.trim();
    if (lastName) user.lastName = lastName.trim();

    const updatedUser = await user.save();
    res
      .status(200)
      .json({ success: true, user: updatedUser, message: "Profile updated" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

const updateAvatar = async (req, res) => {
  try {
    if (!req.file)
      return res
        .status(400)
        .json({ success: false, message: "No image uploaded" });
    const relativePath = req.file.path
      .replace(/\\/g, "/")
      .replace("public/", "/");

    await User.findByIdAndUpdate(req.user._id, { profileImage: relativePath });
    res
      .status(200)
      .json({
        success: true,
        message: "Avatar updated",
        imagePath: relativePath,
      });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

const removeAvatar = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // 1. Physical File Deletion (Cleanup)
    if (user.profileImage) {
      // Reconstruct the full path to the image
      // We assume the path is stored as '/uploads/profiles/filename.jpg'
      const filePath = path.join(__dirname, "../../public", user.profileImage);

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    // 2. Clear the reference in the database
    user.profileImage = null;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Avatar removed successfully",
    });
  } catch (error) {
    console.error("Error removing avatar:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword, confirmPassword } = req.body;
    if (newPassword !== confirmPassword)
      return res.status(400).json({ message: "Passwords do not match" });

    const user = await User.findById(req.user._id);
    const isMatch = await user.matchPassword(oldPassword);
    if (!isMatch)
      return res.status(400).json({ message: "Incorrect old password" });

    user.password = newPassword;
    await user.save();
    res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

const logoutUser = (req, res) => {
  // Clear ONLY the user-specific cookie
  res.cookie("token", "none", {
    expires: new Date(Date.now() + 5 * 1000),
    httpOnly: true,
    path: "/"
  });

  res.status(200).json({ success: true, message: "User logged out" });
};

module.exports = { getProfile, updateProfile, updateAvatar, removeAvatar, changePassword, logoutUser };
