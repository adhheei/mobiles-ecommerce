const mongoose = require('mongoose');

// Section 1: Coupon Schema
const couponSchema = new mongoose.Schema({
    // Coupon Code (Unique, Uppercase)
    code: {
        type: String,
        required: [true, 'Coupon code is required'],
        unique: true,
        uppercase: true,
        trim: true,
        minlength: [3, 'Coupon code must be at least 3 characters']
    },

    // Discount Type (Enum)
    discountType: {
        type: String,
        enum: {
            values: ['fixed', 'percentage'],
            message: 'Discount type must be either fixed or percentage'
        },
        required: [true, 'Discount type is required']
    },

    // Value (Number) - INR for fixed, 1-100 for percentage
    value: {
        type: Number,
        required: [true, 'Discount value is required'],
        min: [1, 'Discount value must be at least 1']
    },

    // Start Date
    startDate: {
        type: Date,
        required: [true, 'Start date is required'],
        default: Date.now
    },

    // End Date
    endDate: {
        type: Date,
        required: [true, 'End date is required']
    },

    // Conditions
    minPurchase: { // Minimum Purchase Value (INR)
        type: Number,
        default: 0,
        min: [0, 'Minimum purchase cannot be negative']
    },

    maxDiscount: { // Maximum Discount Value (INR) - Optional
        type: Number,
        default: null
    },

    // Usage Limits
    totalLimit: { // Total Usage Limit
        type: Number,
        default: null // null means unlimited
    },

    perUserLimit: { // Limit Per Customer
        type: Number,
        default: 1,
        min: [1, 'Per user limit must be at least 1']
    },

    // Tracking
    totalUsed: {
        type: Number,
        default: 0
    },

    // Map of userId -> count
    userUsage: {
        type: Map,
        of: Number,
        default: {}
    },

    isActive: {
        type: Boolean,
        default: true
    }

}, { timestamps: true });

module.exports = mongoose.model('Coupon', couponSchema);
