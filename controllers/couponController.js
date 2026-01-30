const Coupon = require('../models/Coupon');

// Section 2: Coupon Controller

// @desc    Create a new coupon
// @route   POST /api/admin/coupons
// @access  Private/Admin
const createCoupon = async (req, res) => {
    try {
        const {
            code,
            discountType,
            value,
            startDate,
            endDate,
            minPurchase,
            maxDiscount,
            totalLimit,
            perUserLimit
        } = req.body;

        // 1. Basic Validation (Server-side)
        if (!code || !discountType || !value || !endDate) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields: code, discountType, value, endDate'
            });
        }

        // 2. Validate Discount Type
        if (!['fixed', 'percentage'].includes(discountType)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid discount type'
            });
        }

        // 3. Validate Value (INR or Percentage)
        if (value <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Value must be greater than 0'
            });
        }
        if (discountType === 'percentage' && value > 100) {
            return res.status(400).json({
                success: false,
                message: 'Percentage discount cannot exceed 100%'
            });
        }

        // 4. Validate Dates
        const start = startDate ? new Date(startDate) : new Date();
        const end = new Date(endDate);

        if (end <= start) {
            return res.status(400).json({
                success: false,
                message: 'End date must be after start date'
            });
        }

        // 5. Check Duplicate Code
        const existingCoupon = await Coupon.findOne({ code: code.toUpperCase() });
        if (existingCoupon) {
            return res.status(409).json({
                success: false,
                message: 'Coupon code already exists'
            });
        }

        // 6. Create Coupon (Monetary values are stored as Numbers, implicit INR)
        const newCoupon = new Coupon({
            code,
            discountType,
            value,
            startDate: start,
            endDate: end,
            minPurchase: minPurchase || 0,
            maxDiscount: maxDiscount || null,
            totalLimit: totalLimit || null,
            perUserLimit: perUserLimit || 1
        });

        await newCoupon.save();

        res.status(201).json({
            success: true,
            data: newCoupon,
            message: 'Coupon created successfully'
        });

    } catch (error) {
        console.error('Create Coupon Error:', error);
        // Handle Mongoose Validation Errors
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({
                success: false,
                message: messages.join(', ')
            });
        }
        // General Server Error
        res.status(500).json({
            success: false,
            message: 'Server Error: Failed to create coupon'
        });
    }
};

// @desc    Get all coupons
// @route   GET /api/admin/coupons
// @access  Private/Admin
const getCoupons = async (req, res) => {
    try {
        const coupons = await Coupon.find().sort({ createdAt: -1 });
        res.status(200).json({ success: true, count: coupons.length, data: coupons });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Delete coupon
// @route   DELETE /api/admin/coupons/:id
// @access  Private/Admin
const deleteCoupon = async (req, res) => {
    try {
        const coupon = await Coupon.findById(req.params.id);
        if (!coupon) {
            return res.status(404).json({ success: false, message: 'Coupon not found' });
        }
        await coupon.deleteOne();
        res.status(200).json({ success: true, message: 'Coupon deleted' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};


module.exports = {
    createCoupon,
    getCoupons,
    deleteCoupon
};
