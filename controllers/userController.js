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
        const { oldPassword, newPassword, confirmPassword } = req.body;
        const userId = req.user._id; // Provided by protect middleware

        // 1. Validation
        if (!oldPassword || !newPassword || !confirmPassword) {
            return res.status(400).json({ message: "All fields are required" });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({ message: "New passwords do not match" });
        }

        // 2. Find User
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // 3. Verify Old Password
        // We use the matchPassword method defined in your User model
        const isMatch = await user.matchPassword(oldPassword);
        if (!isMatch) {
            return res.status(400).json({ message: "Incorrect old password" });
        }

        // 4. Update Password
        // Your User model has a pre('save') hook that will automatically 
        // hash this new password before saving it to MongoDB.
        user.password = newPassword;
        await user.save();

        res.status(200).json({ message: "Password updated successfully. Please login again." });

    } catch (error) {
        console.error("Change Password Error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// @desc    Get all users (Admin)
// @route   GET /api/admin/users
// @access  Private/Admin
const getAllUsers = async (req, res) => {
    try {
        const usersWithOrderCounts = await User.aggregate([
            { $match: { isDeleted: { $ne: true } } },
            {
                $lookup: {
                    from: "orders",
                    localField: "_id",
                    foreignField: "userId",
                    as: "userOrders"
                }
            },
            {
                $addFields: {
                    // This creates the 'orderCount' field your frontend is already using
                    orderCount: { $size: "$userOrders" }
                }
            },
            {
                $project: {
                    password: 0,
                    userOrders: 0
                }
            },
            { $sort: { createdAt: -1 } }
        ]);

        res.json({ success: true, users: usersWithOrderCounts });
    } catch (error) {
        console.error("Aggregation Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};
// @desc    Block/Unblock user (Admin)
// @route   PATCH /api/admin/users/:id/block
// @access  Private/Admin
const toggleBlockUser = async (req, res) => {
    try {
        const { isBlocked } = req.body;
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        user.isBlocked = isBlocked;
        user.status = isBlocked ? 'Suspended' : 'Active'; // Sync status with block state
        await user.save();

        res.status(200).json({
            success: true,
            message: `User ${isBlocked ? 'blocked' : 'unblocked'} successfully`,
            user: {
                _id: user._id,
                status: user.status,
                isBlocked: user.isBlocked
            }
        });
    } catch (error) {
        console.error("Error toggling block status:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

// --- WALLET CONTROLLER LOGIC ---

const Wallet = require("../models/Wallet");

// @desc    Get User Wallet
// @route   GET /api/wallet
// @access  Private
const getWallet = async (req, res) => {
    try {
        let wallet = await Wallet.findOne({ userId: req.user._id });
        if (!wallet) {
            wallet = await Wallet.create({ userId: req.user._id, balance: 0, transactions: [] });
        }

        // Ensure transactions array exists
        if (!wallet.transactions) {
            wallet.transactions = [];
        }

        // Sort transactions desc
        wallet.transactions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        // Return only last 20
        const recentTransactions = wallet.transactions.slice(0, 20);

        res.status(200).json({
            success: true,
            balance: wallet.balance,
            transactions: recentTransactions
        });
    } catch (error) {
        console.error("Get Wallet Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

// @desc    Apply Wallet for Checkout Calculation
// @route   POST /api/wallet/apply
// @access  Private
const applyWallet = async (req, res) => {
    try {
        console.log("👉 Wallet Apply Called");
        console.log("User ID:", req.user ? req.user._id : "No User");
        console.log("Body:", req.body);

        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const { totalAmount } = req.body;

        if (totalAmount === undefined || totalAmount === null) {
            return res.status(400).json({ message: "Total amount required" });
        }

        const wallet = await Wallet.findOne({ userId: req.user._id });
        console.log("Wallet Found:", wallet ? wallet.balance : "No Wallet");

        const balance = wallet ? wallet.balance : 0;
        const walletUsable = Math.min(balance, totalAmount);
        const payableAmount = totalAmount - walletUsable;

        res.status(200).json({
            success: true,
            walletBalance: balance,
            walletUsable: walletUsable,
            payableAmount: payableAmount
        });
    } catch (error) {
        console.error("❌ Apply Wallet Error:", error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

// @desc    Admin: Get User Wallet
// @route   GET /api/admin/wallet/:userId
// @access  Private/Admin
const adminGetWallet = async (req, res) => {
    try {
        let wallet = await Wallet.findOne({ userId: req.params.userId });
        if (!wallet) {
            // Create if not exists to facilitate admin adding money
            wallet = new Wallet({ userId: req.params.userId });
            // Don't save yet unless needed, but returning 0 is fine
        }
        res.status(200).json({
            success: true,
            balance: wallet.balance,
            transactions: wallet.transactions ? wallet.transactions.sort((a, b) => b.createdAt - a.createdAt) : []
        });
    } catch (error) {
        console.error("Admin Get Wallet Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

// @desc    Admin: Update Wallet (Add/Deduct)
// @route   POST /api/admin/wallet/update
// @access  Private/Admin
const adminUpdateWallet = async (req, res) => {
    try {
        const { userId, type, amount, reason } = req.body;
        // type: 'CREDIT' or 'DEBIT'

        if (amount <= 0) return res.status(400).json({ message: "Amount must be positive" });

        let wallet = await Wallet.findOne({ userId });
        if (!wallet) {
            wallet = new Wallet({ userId });
        }

        if (type === 'DEBIT') {
            if (wallet.balance < amount) {
                return res.status(400).json({ message: "Insufficient wallet balance" });
            }
            wallet.balance -= amount;
        } else {
            wallet.balance += amount;
        }

        wallet.transactions.push({
            userId,
            amount,
            type,
            reason: reason || (type === 'CREDIT' ? 'ADMIN_ADD' : 'ADMIN_DEDUCT'),
            createdAt: new Date()
        });

        await wallet.save();

        res.status(200).json({
            success: true,
            message: "Wallet updated successfully",
            balance: wallet.balance
        });

    } catch (error) {
        console.error("Admin Update Wallet Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};


module.exports = {
    getProfile,
    updateProfile,
    updateAvatar,
    getWishlist,
    addToWishlist,
    removeFromWishlist,
    changePassword,
    getAllUsers,
    toggleBlockUser,
    getWallet,
    applyWallet,
    adminGetWallet,
    adminUpdateWallet
};
