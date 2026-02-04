const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    orderId: {
        type: String, // Custom friendly ID e.g. ORD-123456
        required: true,
        unique: true
    },
    items: [{
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        name: { type: String, required: true },
        image: { type: String },
        price: { type: Number, required: true }, // Selling Price
        mrp: { type: Number }, // Original MRP
        quantity: { type: Number, required: true },
        status: {
            type: String,
            enum: ['Processing', 'Shipped', 'Delivered', 'Cancelled', 'Returned'],
            default: 'Processing'
        }
    }],
    shippingAddress: {
        fullName: String,
        phone: String,
        street: String,
        city: String,
        state: String,
        pincode: String,
        country: String
    },
    paymentMethod: {
        type: String,
        required: true
    },
    paymentStatus: {
        type: String,
        enum: ['Pending', 'Paid', 'Failed', 'Refunded'],
        default: 'Pending'
    },
    totals: {
        subtotal: Number, // Total Selling Price
        totalMrp: Number, // Total MRP
        productDiscount: Number, // MRP - Selling Price
        couponDiscount: Number,
        walletDeducted: Number,
        shipping: Number,
        totalAmount: Number // Grand Total
    },
    orderStatus: { // Overall Order Status
        type: String,
        enum: ['Processing', 'Shipped', 'Delivered', 'Cancelled', 'Returned'],
        default: 'Processing'
    },
    appliedCoupon: { type: String },
    createdAt: {
        type: Date,
        default: Date.now
    },
    deliveredAt: {
        type: Date
    }
});

module.exports = mongoose.model('Order', orderSchema);
