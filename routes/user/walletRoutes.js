const express = require("express");
const router = express.Router();
const wallet = require("../../controllers/wallet");

// Mounted at /api/user/wallet
router.get("/", wallet.getWallet);
router.post("/apply", wallet.applyWallet);

module.exports = router;
