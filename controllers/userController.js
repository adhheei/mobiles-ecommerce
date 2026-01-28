const User = require("../models/User");

// @desc    Get current user profile
// @route   GET /api/user/profile
// @access  Private
const getProfile = async (req, res) => {
    try {
        // req.user is already attached by the auth middleware
        const user = await User.findById(req.user._id).select(
            "firstName lastName email phone profileImage"
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        res.status(200).json({
            success: true,
            user: {
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                phone: user.phone,
                profileImage: user.profileImage,
            },
        });
    } catch (error) {
        console.error("Error fetching profile:", error);
        res.status(500).json({
            success: false,
            message: "Server Error",
        });
    }
};

// @desc    Update user profile
// @route   PUT /api/user/profile
// @access  Private
const updateProfile = async (req, res) => {
    try {
        const { firstName, lastName, phone } = req.body;

        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        // Check if phone number is being changed and if it's already taken
        if (phone && phone !== user.phone) {
            const phoneExists = await User.findOne({ phone });
            if (phoneExists) {
                return res.status(400).json({
                    success: false,
                    message: "Mobile number already in use",
                });
            }
            user.phone = phone;
        }

        if (firstName) user.firstName = firstName.trim();
        if (lastName) user.lastName = lastName.trim();

        const updatedUser = await user.save();

        res.status(200).json({
            success: true,
            user: {
                firstName: updatedUser.firstName,
                lastName: updatedUser.lastName,
                email: updatedUser.email,
                phone: updatedUser.phone,
            },
            message: "Profile updated successfully",
        });
    } catch (error) {
        console.error("Error updating profile:", error);
        res.status(500).json({
            success: false,
            message: "Server Error",
        });
    }
};

// @desc    Update user avatar
// @route   PUT /api/user/avatar
// @access  Private
const updateAvatar = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "No image uploaded",
            });
        }

        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        // path relative to public folder for frontend access
        // Remove 'public' from the path string if stored with 'public/' prefix by multer
        // Multer validation already done

        // Normalize path separators for Windows
        const relativePath = req.file.path.replace(/\\/g, "/").replace("public/", "/");

        user.profileImage = relativePath;
        await user.save();

        res.status(200).json({
            success: true,
            message: "Avatar updated successfully",
            imagePath: user.profileImage,
        });
    } catch (error) {
        console.error("Error updating avatar:", error);
        res.status(500).json({
            success: false,
            message: "Server Error",
        });
    }
};

module.exports = { getProfile, updateProfile, updateAvatar };
