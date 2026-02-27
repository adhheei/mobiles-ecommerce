const Message = require("../../models/Message");
const transporter = require("../../utils/emailTransport"); // Using shared util

const replyToMessage = async (req, res) => {
    try {
        const { id } = req.params;
        const { reply } = req.body;

        if (!reply) return res.status(400).json({ error: "Reply cannot be empty" });

        const message = await Message.findById(id);
        if (!message) return res.status(404).json({ error: "Message not found" });

        message.adminReply = reply;
        message.repliedAt = Date.now();
        message.isReplied = true;
        message.status = "replied";
        await message.save();

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: message.email,
            subject: "Reply from Jinsa Mobiles Support",
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                    <h2>Hello ${message.name},</h2>
                    <p>Thank you for contacting us. Here is the response to your message.</p>
                    <div style="background: #f9f9f9; padding: 15px; border-left: 4px solid #ccc; margin: 20px 0;">
                        <b>Your Message:</b><br>"${message.message}"
                    </div>
                    <div style="background: #e6f7ff; padding: 15px; border-left: 4px solid #007bff; margin: 20px 0;">
                        <b style="color: #007bff;">Our Reply:</b><br>${reply}
                    </div>
                    <p>Best Regards,<br><strong>Jinsa Mobiles Team</strong></p>
                </div>`
        };

        await transporter.sendMail(mailOptions);
        res.json({ success: true, message: "Reply sent successfully", data: message });

    } catch (error) {
        console.error("Error sending reply:", error);
        res.status(500).json({ error: "Failed to send reply" });
    }
};

module.exports = replyToMessage;