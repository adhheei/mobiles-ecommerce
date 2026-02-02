const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
    },
    subject: {
        type: String,
        required: true,
        trim: true,
    },
    message: {
        type: String,
        required: true,
    },
    isRead: {
        type: Boolean,
        default: false,
    },
    status: {
        type: String,
        enum: ["unread", "seen", "replied"],
        default: "unread",
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    // Reply fields
    adminReply: {
        type: String,
        trim: true
    },
    repliedAt: {
        type: Date
    },
    isReplied: {
        type: Boolean,
        default: false
    }
});

module.exports = mongoose.model("Message", messageSchema);
