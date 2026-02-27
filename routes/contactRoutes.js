const express = require("express");
const router = express.Router();
const message = require("../controllers/message");

router.post("/", message.submitContactForm);

module.exports = router;