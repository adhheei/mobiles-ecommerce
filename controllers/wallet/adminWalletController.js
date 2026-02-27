const Wallet = require("../../models/Wallet");

/**
 * @desc    Get a specific user's wallet balance and history for Admin
 * @route   GET /api/admin/wallet/:userId
 * @access  Private/Admin
 */
const adminGetWallet = async (req, res) => {
    try {
        const { userId } = req.params;
        
        let wallet = await Wallet.findOne({ userId });
        
        if (!wallet) {
            // If user hasn't used wallet yet, return a virtual zero-balance object
            // so Admin can still see/add money
            return res.status(200).json({
                success: true,
                balance: 0,
                transactions: [],
            });
        }

        res.status(200).json({
            success: true,
            balance: wallet.balance,
            transactions: wallet.transactions
                ? wallet.transactions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                : [],
        });
    } catch (error) {
        console.error("Admin Get Wallet Error:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

/**
 * @desc    Manually add or deduct money from a user's wallet
 * @route   POST /api/admin/wallet/update
 * @access  Private/Admin
 */
const adminUpdateWallet = async (req, res) => {
    try {
        const { userId, type, amount, reason } = req.body;
        // type expected: 'CREDIT' (Add) or 'DEBIT' (Remove)

        const numAmount = parseFloat(amount);
        if (isNaN(numAmount) || numAmount <= 0) {
            return res.status(400).json({ success: false, message: "Amount must be a positive number" });
        }

        let wallet = await Wallet.findOne({ userId });
        
        // Create wallet on the fly if Admin is adding first-time funds
        if (!wallet) {
            wallet = new Wallet({ userId, balance: 0, transactions: [] });
        }

        if (type === "DEBIT") {
            if (wallet.balance < numAmount) {
                return res.status(400).json({ success: false, message: "Insufficient wallet balance for this deduction" });
            }
            wallet.balance -= numAmount;
        } else {
            wallet.balance += numAmount;
        }

        // Record the manual adjustment in transaction history
        wallet.transactions.push({
            userId,
            amount: numAmount,
            type,
            reason: reason || (type === "CREDIT" ? "ADMIN_ADD" : "ADMIN_DEDUCT"),
            createdAt: new Date(),
        });

        await wallet.save();

        res.status(200).json({
            success: true,
            message: `Wallet ${type === 'CREDIT' ? 'credited' : 'debited'} successfully`,
            balance: wallet.balance,
        });
    } catch (error) {
        console.error("Admin Update Wallet Error:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

module.exports = {
    adminGetWallet,
    adminUpdateWallet
};