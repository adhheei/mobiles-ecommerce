const submitContactForm = require("./submitContactForm");
const getMessages = require("./getMessages");
const { markAsSeen, markAsReplied } = require("./markStatus");
const replyToMessage = require("./replyToMessage");
const getUnreadCount = require("./getUnreadCount");
const deleteMessage = require("./deleteMessage");

module.exports = {
    submitContactForm,
    getMessages,
    markAsSeen,
    markAsReplied,
    replyToMessage,
    getUnreadCount,
    deleteMessage
};