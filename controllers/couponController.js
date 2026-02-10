const Coupon = require("../models/Coupon");

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
      perUserLimit,
    } = req.body;

    // 1. Basic Validation (Server-side)
    if (!code || !discountType || !value || !endDate) {
      return res.status(400).json({
        success: false,
        message:
          "Please provide all required fields: code, discountType, value, endDate",
      });
    }

    // 2. Validate Discount Type
    if (!["fixed", "percentage"].includes(discountType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid discount type",
      });
    }

    // 3. Validate Value (INR or Percentage)
    if (value <= 0) {
      return res.status(400).json({
        success: false,
        message: "Value must be greater than 0",
      });
    }
    if (discountType === "percentage" && value > 100) {
      return res.status(400).json({
        success: false,
        message: "Percentage discount cannot exceed 100%",
      });
    }

    // 4. Validate Dates
    const start = startDate ? new Date(startDate) : new Date();
    const end = new Date(endDate);

    // Set end date to end of day (23:59:59.999) to allow same-day coupons
    end.setHours(23, 59, 59, 999);

    if (end <= start) {
      return res.status(400).json({
        success: false,
        message: "End date must be after start date",
      });
    }

    // 5. Check Duplicate Code
    const existingCoupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (existingCoupon) {
      return res.status(409).json({
        success: false,
        message: "Coupon code already exists",
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
      perUserLimit: perUserLimit || 1,
    });

    await newCoupon.save();

    res.status(201).json({
      success: true,
      data: newCoupon,
      message: "Coupon created successfully",
    });
  } catch (error) {
    console.error("Create Coupon Error:", error);

    // Handle Mongoose Validation Errors
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res.status(400).json({
        success: false,
        message: messages.join(", "),
      });
    }

    // Handle Generic Errors (e.g., from pre-save hooks)
    if (
      error.message &&
      (error.message.includes("End date must be") ||
        error.message.includes("Percentage"))
    ) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    // Handle Duplicate Key Error (E11000)
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Coupon code already exists",
      });
    }

    // General Server Error
    res.status(500).json({
      success: false,
      message: "Server Error: Failed to create coupon. Check logs.",
    });
  }
};

// @desc    Get all coupons
// @route   GET /api/admin/coupons
// @access  Private/Admin
const getCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res
      .status(200)
      .json({ success: true, count: coupons.length, data: coupons });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// @desc    Delete coupon
// @route   DELETE /api/admin/coupons/:id
// @access  Private/Admin
const deleteCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
      return res
        .status(404)
        .json({ success: false, message: "Coupon not found" });
    }
    await coupon.deleteOne();
    res.status(200).json({ success: true, message: "Coupon deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// @desc    Get single coupon
// @route   GET /api/admin/coupons/:id
// @access  Private/Admin
const getCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
      return res
        .status(404)
        .json({ success: false, message: "Coupon not found" });
    }
    res.status(200).json({ success: true, data: coupon });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// @desc    Update coupon
// @route   PUT /api/admin/coupons/:id
// @access  Private/Admin
const updateCoupon = async (req, res) => {
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
      perUserLimit,
      isActive,
    } = req.body;

    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
      return res
        .status(404)
        .json({ success: false, message: "Coupon not found" });
    }

    // Validate Dates
    const start = startDate ? new Date(startDate) : coupon.startDate;
    const end = endDate ? new Date(endDate) : coupon.endDate;
    if (endDate) end.setHours(23, 59, 59, 999);

    if (end <= start) {
      return res
        .status(400)
        .json({ success: false, message: "End date must be after start date" });
    }

    // Check Duplicate Code (if changed)
    if (code && code !== coupon.code) {
      const existing = await Coupon.findOne({ code: code.toUpperCase() });
      if (existing) {
        return res
          .status(409)
          .json({ success: false, message: "Coupon code already exists" });
      }
      coupon.code = code.toUpperCase();
    }

    // Update Fields
    if (discountType) coupon.discountType = discountType;
    if (value) coupon.value = value;
    coupon.startDate = start;
    coupon.endDate = end;
    if (minPurchase !== undefined) coupon.minPurchase = minPurchase;
    if (maxDiscount !== undefined) coupon.maxDiscount = maxDiscount;
    if (totalLimit !== undefined) coupon.totalLimit = totalLimit;
    if (perUserLimit !== undefined) coupon.perUserLimit = perUserLimit;
    if (isActive !== undefined) coupon.isActive = isActive;

    await coupon.save();

    res.status(200).json({
      success: true,
      data: coupon,
      message: "Coupon updated successfully",
    });
  } catch (error) {
    console.error("Update Coupon Error:", error);
    if (error.code === 11000) {
      return res
        .status(409)
        .json({ success: false, message: "Coupon code already exists" });
    }
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// @desc    Get coupons for user (Active & Used/Expired)
// @route   GET /api/user/coupons
// @access  Private/User
const getAvailableCoupons = async (req, res) => {
  try {
    const userId = req.user._id.toString();

    // Fetch all coupons (you might want to limit this if there are many)
    const coupons = await Coupon.find({}).sort({ endDate: -1 }).lean();

    const processedCoupons = coupons.map((coupon) => {
      const usageCount = coupon.userUsage ? coupon.userUsage[userId] || 0 : 0;
      const isRedeemed =
        coupon.perUserLimit && usageCount >= coupon.perUserLimit;
      const isExpired = new Date(coupon.endDate) < new Date();

      return {
        ...coupon,
        isUsed: isRedeemed, // Renamed for frontend consistency
        isExpired: isExpired,
      };
    });

    res.status(200).json({
      success: true,
      count: processedCoupons.length,
      data: processedCoupons,
    });
  } catch (error) {
    console.error("Get User Coupons Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// @desc    Apply coupon to cart total
// @route   POST /api/user/coupons/apply
// @access  Private/User
const applyCoupon = async (req, res) => {
  try {
    const { couponCode } = req.body;
    const userId = req.user._id;

    // 1. Fetch Cart from DB
    const Cart = require("../models/Cart"); // Lazy load or move to top
    // Populate product to get price
    const cart = await Cart.findOne({ userId }).populate("items.productId");

    if (!cart || !cart.items || cart.items.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "Cart is empty" });
    }

    // 2. Calculate Total (Backend Source of Truth)
    let totalAmount = 0;
    cart.items.forEach((item) => {
      if (item.productId) {
        const price = item.productId.offerPrice || item.productId.price || 0;
        totalAmount += price * item.quantity;
      }
    });

    console.log(`[DEBUG] Backend Calculated Total for User ${userId}: ${totalAmount}`);

    // 3. Find Coupon
    const coupon = await Coupon.findOne({
      code: couponCode.toUpperCase(),
      isActive: true,
    });

    if (!coupon) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid or inactive coupon" });
    }

    // 4. Validate Dates
    const now = new Date();
    if (now < new Date(coupon.startDate) || now > new Date(coupon.endDate)) {
      return res.status(400).json({ success: false, message: "Coupon is expired" });
    }

    // 5. Check Usage Limit
    const userUsage = (coupon.userUsage && coupon.userUsage.get(userId.toString())) || 0;
    if (coupon.perUserLimit && userUsage >= coupon.perUserLimit) {
      return res.status(400).json({ success: false, message: "Coupon usage limit reached" });
    }

    // 6. VALIDATION: Minimum Purchase Check
    if (totalAmount < coupon.minPurchase) {
      return res.status(400).json({
        success: false,
        message: `Minimum purchase of Rs. ${coupon.minPurchase} required. Your total is Rs. ${totalAmount}`,
      });
    }

    // 7. Calculate Discount
    let discount =
      coupon.discountType === "fixed"
        ? coupon.value
        : (totalAmount * coupon.value) / 100;

    if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);

    // Ensure discount doesn't exceed total
    discount = Math.min(discount, totalAmount);

    res.status(200).json({
      success: true,
      code: coupon.code,
      discountAmount: discount,
      finalTotal: totalAmount - discount,
      cartTotal: totalAmount // Send back confirmed total
    });
  } catch (error) {
    console.error("Apply Coupon Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

module.exports = {
  createCoupon,
  getCoupons,
  deleteCoupon,
  getCoupon,
  updateCoupon,
  getAvailableCoupons,
  applyCoupon,
};
