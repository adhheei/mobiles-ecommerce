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

// Reply to Message
exports.replyToMessage = async (req, res) => {
    try {
        const { id } = req.params;
        const { reply } = req.body;

        if (!reply) {
            return res.status(400).json({ error: "Reply message cannot be empty" });
        }

        const message = await Message.findById(id);
        if (!message) {
            return res.status(404).json({ error: "Message not found" });
        }

        // Update Message
        message.adminReply = reply;
        message.repliedAt = Date.now();
        message.isReplied = true;
        message.status = "replied"; // Ensure status is synced
        await message.save();

        // Start Email Logic (using existing nodemailer setup if available, or create new)
        // Note: Ideally import transporter from authController or shared config
        // For now, I'll require nodemailer locally here if not available globally, 
        // but since authController has it, let's copy the transporter setup or hope for shared file.
        // Looking at structure, it's best to duplicate transporter init here for safety unless I move it to config.
        const nodemailer = require("nodemailer");
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: message.email,
            subject: "Reply from Jinsa Mobiles Support",
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                    <h2 style="color: #000;">Hello ${message.name},</h2>
                    <p>Thank you for contacting us. Here is the response to your message.</p>
                    
                    <div style="background: #f9f9f9; padding: 15px; border-left: 4px solid #ccc; margin: 20px 0;">
                        <p style="margin: 0; font-weight: bold;">Your Message:</p>
                        <p style="margin-top: 5px;">"${message.message}"</p>
                    </div>

                    <div style="background: #e6f7ff; padding: 15px; border-left: 4px solid #007bff; margin: 20px 0;">
                        <p style="margin: 0; font-weight: bold; color: #007bff;">Our Reply:</p>
                        <p style="margin-top: 5px;">${reply}</p>
                    </div>

                    <p>If you have further questions, feel free to reply to this email.</p>
                    <br>
                    <p>Best Regards,<br><strong>Jinsa Mobiles Team</strong></p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);

        res.json({ success: true, message: "Reply sent and saved successfully", data: message });

    } catch (error) {
        console.error("Error sending reply:", error);
        res.status(500).json({ error: "Failed to send reply" });
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
