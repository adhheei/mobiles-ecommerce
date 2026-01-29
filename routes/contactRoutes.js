const express = require("express");
const router = express.Router();
const messageController = require("../controllers/messageController");

// POST /api/contact - Submit contact form
router.post("/", messageController.submitContactForm);

module.exports = router;
