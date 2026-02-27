const User = require("../../models/User");

const getAllUsers = async (req, res) => {
    try {
        const users = await User.aggregate([
            { $match: { isDeleted: { $ne: true } } },
            { $lookup: { from: "orders", localField: "_id", foreignField: "userId", as: "orders" } },
            { $addFields: { orderCount: { $size: "$orders" } } },
            { $project: { password: 0, orders: 0 } },
            { $sort: { createdAt: -1 } }
        ]);
        res.status(200).json({ success: true, users });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

const toggleBlockUser = async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(req.params.id, { isBlocked: req.body.isBlocked }, { new: true });
        res.status(200).json({ success: true, message: `User ${user.isBlocked ? 'blocked' : 'unblocked'}`, isBlocked: user.isBlocked });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

module.exports = { getAllUsers, toggleBlockUser };