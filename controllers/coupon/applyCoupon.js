const Coupon = require("../../models/Coupon");
const Cart = require("../../models/Cart");

const applyCoupon = async (req, res) => {
  try {
    const { couponCode } = req.body;
    const userId = req.user._id;

    const cart = await Cart.findOne({ userId }).populate("items.productId");
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: "Cart is empty" });
    }

    let totalAmount = 0;
    cart.items.forEach(item => {
      if (item.productId) {
        const price = item.productId.offerPrice || item.productId.price || 0;
        totalAmount += price * item.quantity;
      }
    });

    const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });
    if (!coupon) return res.status(400).json({ success: false, message: "Invalid coupon" });

    const now = new Date();
    if (now < coupon.startDate || now > coupon.endDate) {
      return res.status(400).json({ success: false, message: "Coupon expired" });
    }

    const userUsage = (coupon.userUsage && coupon.userUsage.get(userId.toString())) || 0;
    if (coupon.perUserLimit && userUsage >= coupon.perUserLimit) {
      return res.status(400).json({ success: false, message: "Usage limit reached" });
    }

    if (totalAmount < coupon.minPurchase) {
      return res.status(400).json({ success: false, message: `Minimum purchase of ₹${coupon.minPurchase} required` });
    }

    let discount = coupon.discountType === "fixed" ? coupon.value : (totalAmount * coupon.value) / 100;
    if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
    discount = Math.min(discount, totalAmount);

    res.status(200).json({
      success: true,
      code: coupon.code,
      discountAmount: discount,
      finalTotal: totalAmount - discount,
      cartTotal: totalAmount
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

module.exports = applyCoupon;