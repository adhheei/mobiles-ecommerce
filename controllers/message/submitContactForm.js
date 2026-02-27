const Message = require("../../models/Message");

const submitContactForm = async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;

        if (!name || !email || !subject || !message) {
            return res.status(400).json({ error: "All fields are required" });
        }

        const newMessage = await Message.create({ name, email, subject, message });

        res.status(201).json({ success: true, message: "Message sent successfully" });
    } catch (error) {
        console.error("Error submitting contact form:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

module.exports = submitContactForm;