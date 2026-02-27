const Message = require("../../models/Message");

// Mark Message as Seen
exports.markAsSeen = async (req, res) => {
    try {
        const { id } = req.params;
        await Message.updateOne(
            { _id: id, status: "unread" },
            { $set: { status: "seen", isRead: true } }
        );
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
};

// Mark Message as Replied
exports.markAsReplied = async (req, res) => {
    try {
        const { id } = req.params;
        await Message.findByIdAndUpdate(id, { status: "replied", isRead: true });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
};