const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    transactionId: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    orderId: {
        type: String,
        required: true,
        trim: true
    },
    user: {
        name: { type: String, required: true },
        email: { type: String, required: true }
    },
    paymentMethod: {
        type: String,
        required: true,
        enum: ['UPI', 'Card', 'COD', 'Wallet']
    },
    amount: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        required: true,
        enum: ['Success', 'Failed', 'Pending'],
        default: 'Pending'
    },
    date: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Transaction', transactionSchema);
