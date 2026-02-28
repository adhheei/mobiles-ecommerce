const Coupon = require("../../models/Coupon");

const getCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find({ status: "Active" }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      data: coupons || [],
    });
  } catch (error) {
    console.error("Coupon Fetch Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

module.exports = { getCoupons };
