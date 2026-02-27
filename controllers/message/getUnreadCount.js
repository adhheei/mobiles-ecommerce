const Message = require("../../models/Message");

module.exports = async (req, res) => {
    try {
        const count = await Message.countDocuments({
            $or: [{ status: "unread" }, { isRead: false, status: { $exists: false } }]
        });
        res.json({ count });
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
};