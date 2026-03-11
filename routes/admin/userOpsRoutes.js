const express = require("express");
const router = express.Router();
const { isAdmin } = require("../../middleware/authMiddleware");
const transaction = require("../../controllers/transaction");
const user = require("../../controllers/user");
const wallet = require("../../controllers/wallet");

// Mounted at /api/admin to preserve specific paths
router.get("/transactions", isAdmin, transaction.getTransactions);
router.get("/transactions/download", isAdmin, transaction.downloadTransactions);
router.get("/users", isAdmin, user.getAllUsers);
router.patch("/users/:id/block", isAdmin, user.toggleBlockUser);
router.get("/wallet/:userId", isAdmin, wallet.adminGetWallet);

module.exports = router;
