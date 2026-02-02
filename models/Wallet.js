const mongoose = require("mongoose");

const walletTransactionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    type: {
        type: String,
        enum: ["CREDIT", "DEBIT"],
        required: true
    },
    reason: {
        type: String,
        enum: ["ORDER_PAYMENT", "REFUND", "ADMIN_ADD", "ADMIN_DEDUCT", "CASHBACK"],
        required: true
    },
    orderId: {
        type: String, // Can store Order ID string
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const walletSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true
    },
    balance: {
        type: Number,
        default: 0,
        min: 0
    },
    transactions: [walletTransactionSchema]
}, { timestamps: true });

// Prevent negative balance
walletSchema.pre('save', function () {
    if (this.balance < 0) {
        this.balance = 0;
    }
});

module.exports = mongoose.model("Wallet", walletSchema);
