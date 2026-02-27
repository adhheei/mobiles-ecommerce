const Coupon = require("../../models/Coupon");

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

module.exports = updateCoupon;