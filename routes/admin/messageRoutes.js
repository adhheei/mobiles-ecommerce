const express = require("express");
const router = express.Router();
const { isAdmin } = require("../../middleware/authMiddleware");
const message = require("../../controllers/message");

// Mounted at /api/admin/messages
router.get("/", isAdmin, message.getMessages);
router.patch("/:id/seen", isAdmin, message.markAsSeen);
router.patch("/:id/replied", isAdmin, message.markAsReplied);
router.get("/unread-count", isAdmin, message.getUnreadCount);
router.post("/:id/reply", isAdmin, message.replyToMessage);
router.delete("/:id", isAdmin, message.deleteMessage);

module.exports = router;
