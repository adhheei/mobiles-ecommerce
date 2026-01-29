const Message = require("../models/Message");

// Submit Contact Form
exports.submitContactForm = async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;

        if (!name || !email || !subject || !message) {
            return res.status(400).json({ error: "All fields are required" });
        }

        const newMessage = new Message({
            name,
            email,
            subject,
            message,
        });

        await newMessage.save();

        res.status(201).json({ success: true, message: "Message sent successfully" });
    } catch (error) {
        console.error("Error submitting contact form:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

// Get All Messages (Admin)
exports.getMessages = async (req, res) => {
    try {
        console.log("Admin requesting messages...");
        const messages = await Message.find().sort({ createdAt: -1 });
        console.log(`Found ${messages.length} messages.`);
        res.json(messages);
    } catch (error) {
        console.error("Error fetching messages:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

// Mark Message as Seen
exports.markAsSeen = async (req, res) => {
    try {
        const { id } = req.params;
        // Only update if currently unread to preserve 'replied' status
        await Message.updateOne(
            { _id: id, status: "unread" },
            { $set: { status: "seen", isRead: true } }
        );
        res.json({ success: true });
    } catch (error) {
        console.error("Error marking message as seen:", error);
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
        console.error("Error marking message as replied:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

// Get Unread Count
exports.getUnreadCount = async (req, res) => {
    try {
        // Count unread status or isRead:false for backward compatibility
        const count = await Message.countDocuments({
            $or: [{ status: "unread" }, { isRead: false, status: { $exists: false } }]
        });
        res.json({ count });
    } catch (error) {
        console.error("Error fetching unread count:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

// Delete Message
exports.deleteMessage = async (req, res) => {
    try {
        const { id } = req.params;
        const message = await Message.findByIdAndDelete(id);

        if (!message) {
            return res.status(404).json({ error: "Message not found" });
        }

        res.json({ success: true, message: "Message deleted successfully" });
    } catch (error) {
        console.error("Error deleting message:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};
