const Coupon = require("../../models/Coupon");

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

module.exports = getCoupons;