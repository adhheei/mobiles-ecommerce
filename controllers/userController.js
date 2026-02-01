const User = require("../models/User");
const Product = require("../models/Product");
const bcrypt = require("bcryptjs");

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

// @desc    Get user wishlist
// @route   GET /api/user/wishlist
// @access  Private
const getWishlist = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).populate("wishlist");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        res.status(200).json({
            success: true,
            wishlist: user.wishlist,
        });
    } catch (error) {
        console.error("Error fetching wishlist:", error);
        res.status(500).json({
            success: false,
            message: "Server Error",
        });
    }
};

// @desc    Add product to wishlist
// @route   POST /api/user/wishlist
// @access  Private
const addToWishlist = async (req, res) => {
    try {
        const { productId } = req.body;

        if (!productId) {
            return res.status(400).json({
                success: false,
                message: "Product ID is required",
            });
        }

        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        // Check product stock status
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        if (product.stock <= 0 || product.status === 'outofstock') {
            return res.status(400).json({
                success: false,
                message: "This product is currently out of stock and cannot be added to the wishlist."
            });
        }

        // Use addToSet to handle duplicates automatically and robustly
        user.wishlist.addToSet(productId);
        await user.save();

        res.status(200).json({
            success: true,
            message: "Product added to wishlist",
            wishlist: user.wishlist,
        });
    } catch (error) {
        console.error("Error adding to wishlist:", error);
        res.status(500).json({
            success: false,
            message: "Server Error",
        });
    }
};

// @desc    Remove product from wishlist
// @route   DELETE /api/user/wishlist/:productId
// @access  Private
const removeFromWishlist = async (req, res) => {
    try {
        const { productId } = req.params;

        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        user.wishlist = user.wishlist.filter(
            (id) => id.toString() !== productId
        );

        await user.save();

        res.status(200).json({
            success: true,
            message: "Product removed from wishlist",
            wishlist: user.wishlist,
        });
    } catch (error) {
        console.error("Error removing from wishlist:", error);
        res.status(500).json({
            success: false,
            message: "Server Error",
        });
    }
};

const changePassword = async (req, res) => {
    try {
        console.log("Change Password Request Body:", req.body); // Log for debugging
        const { oldPassword, newPassword, confirmPassword } = req.body;
        const userId = req.user.id; // from JWT middleware

        if (!oldPassword || !newPassword || !confirmPassword) {
            return res.status(400).json({ message: "All fields are required" });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({ message: "New password and confirm password do not match" });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Check current password
        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Incorrect old password" });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();

        // Logout user after password change
        res.clearCookie("token");

        res.status(200).json({
            message: "Password changed successfully. Please login again.",
        });
    } catch (error) {
        console.error("Change password error:", error);
        res.status(500).json({ message: "Server error" });
    }
};


module.exports = {
    getProfile,
    updateProfile,
    updateAvatar,
    getWishlist,
    addToWishlist,
    removeFromWishlist,
    changePassword
};
