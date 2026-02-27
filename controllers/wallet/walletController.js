const Wallet = require("../../models/Wallet");

const getWallet = async (req, res) => {
    try {
        let wallet = await Wallet.findOne({ userId: req.user._id });
        if (!wallet) {
            wallet = await Wallet.create({ userId: req.user._id, balance: 0, transactions: [] });
        }

        wallet.transactions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        res.status(200).json({
            success: true,
            balance: wallet.balance,
            transactions: wallet.transactions.slice(0, 20),
        });
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
};

const applyWallet = async (req, res) => {
    try {
        const { totalAmount } = req.body;
        const wallet = await Wallet.findOne({ userId: req.user._id });
        
        const balance = wallet ? wallet.balance : 0;
        const walletUsable = Math.min(balance, totalAmount);

        res.status(200).json({
            success: true,
            walletBalance: balance,
            walletUsable,
            payableAmount: totalAmount - walletUsable,
        });
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
};

module.exports = { getWallet, applyWallet };