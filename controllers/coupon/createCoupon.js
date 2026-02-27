const Coupon = require("../../models/Coupon");

const createCoupon = async (req, res) => {
  try {
    const { code, discountType, value, startDate, endDate, minPurchase, maxDiscount, totalLimit, perUserLimit } = req.body;

    if (!code || !discountType || !value || !endDate) {
      return res.status(400).json({ success: false, message: "Required: code, discountType, value, endDate" });
    }

    if (!["fixed", "percentage"].includes(discountType)) {
      return res.status(400).json({ success: false, message: "Invalid discount type" });
    }

    if (value <= 0 || (discountType === "percentage" && value > 100)) {
      return res.status(400).json({ success: false, message: "Invalid discount value" });
    }

    const start = startDate ? new Date(startDate) : new Date();
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    if (end <= start) {
      return res.status(400).json({ success: false, message: "End date must be after start date" });
    }

    const existingCoupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (existingCoupon) {
      return res.status(409).json({ success: false, message: "Coupon code already exists" });
    }

    const newCoupon = await Coupon.create({
      code: code.toUpperCase(), discountType, value, startDate: start, endDate: end,
      minPurchase: minPurchase || 0, maxDiscount: maxDiscount || null,
      totalLimit: totalLimit || null, perUserLimit: perUserLimit || 1
    });

    res.status(201).json({ success: true, data: newCoupon, message: "Coupon created" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = createCoupon;