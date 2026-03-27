const Order = require("../../models/Order");
const Wallet = require("../../models/Wallet");
const Product = require("../../models/Product");
const Cart = require("../../models/Cart");
const Coupon = require("../../models/Coupon");
const Address = require("../../models/Address");
const Transaction = require("../../models/Transaction");
const crypto = require("crypto");
const { formatImageUrl } = require("../../utils/cartHelpers");
const { sendOrderConfirmationEmail } = require("../../utils/emailService");

const placeOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      paymentMethod,
      useWallet,
      addressId,
      buyNowItem,
      couponCode,
    } = req.body;

    const razorpayPaymentId = req.body.razorpayPaymentId || req.body.razorpay_payment_id;
    const razorpayOrderId = req.body.razorpayOrderId || req.body.razorpay_order_id;
    const razorpaySignature = req.body.razorpaySignature || req.body.razorpay_signature;

    // 1. RAZORPAY VERIFICATION
    if (paymentMethod && paymentMethod.toUpperCase() === "RAZORPAY") {
      const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
      hmac.update(razorpayOrderId + "|" + razorpayPaymentId);
      if (hmac.digest("hex") !== razorpaySignature) {
        return res
          .status(400)
          .json({ success: false, message: "Payment verification failed" });
      }
    }

    // 2. GATHER ITEMS & STOCK CHECK
    let subtotal = 0,
      totalMrp = 0,
      rawItems = [];
    if (buyNowItem) {
      const product = await Product.findById(buyNowItem.productId);
      if (!product || product.stock < buyNowItem.qty) {
        return res
          .status(400)
          .json({ success: false, message: "Product out of stock" });
      }
      const price = product.offerPrice || product.price;
      subtotal = price * buyNowItem.qty;
      totalMrp = (product.actualPrice || product.price) * buyNowItem.qty;
      rawItems.push({
        productId: product._id,
        name: product.name,
        price,
        mrp: product.actualPrice || product.price,
        quantity: buyNowItem.qty,
        totalItemPrice: price * buyNowItem.qty, // Added required field
        image: formatImageUrl(product.mainImage),
      });
    } else {
      const cart = await Cart.findOne({ userId }).populate("items.productId");
      if (!cart || cart.items.length === 0)
        return res.status(400).json({ message: "Cart empty" });

      for (const item of cart.items) {
        if (!item.productId || item.productId.stock < item.quantity) {
          return res
            .status(400)
            .json({ message: `${item.productId?.name} is out of stock` });
        }
        const price = item.productId.offerPrice || item.productId.price;
        subtotal += price * item.quantity;
        totalMrp +=
          (item.productId.actualPrice || item.productId.price) * item.quantity;
        rawItems.push({
          productId: item.productId._id,
          name: item.productId.name,
          price,
          mrp: item.productId.actualPrice || item.productId.price,
          quantity: item.quantity,
          totalItemPrice: price * item.quantity, // Added required field
          image: formatImageUrl(item.productId.mainImage),
        });
      }
    }

    // 3. COUPON LOGIC
    let couponDiscount = 0,
      appliedCouponCode = null;
    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode, isActive: true });
      if (coupon && subtotal >= coupon.minPurchase) {
        const userUses = coupon.userUsage.get(userId.toString()) || 0;
        if (userUses < coupon.perUserLimit) {
          couponDiscount =
            coupon.discountType === "percentage"
              ? (subtotal * coupon.value) / 100
              : coupon.value;
          if (coupon.maxDiscount)
            couponDiscount = Math.min(couponDiscount, coupon.maxDiscount);
          couponDiscount = Math.min(couponDiscount, subtotal);
          appliedCouponCode = couponCode;
          coupon.totalUsed += 1;
          coupon.userUsage.set(userId.toString(), userUses + 1);
          await coupon.save();
        }
      }
    }

    // 4. ADDRESS & WALLET PRE-CALCULATION
    const addr = await Address.findById(addressId);
    if (!addr) return res.status(400).json({ message: "Address not found" });

    let finalAmount = subtotal - couponDiscount;
    let walletDeducted = 0;
    let wallet = await Wallet.findOne({ userId });

    if (useWallet && wallet && wallet.balance > 0) {
      walletDeducted = Math.min(wallet.balance, finalAmount);
    }

    // 5. CREATE ORDER
    const newOrder = await Order.create({
      userId,
      orderId: "ORD-" + Date.now(),
      items: rawItems.map((item) => ({ ...item, status: "Processing" })),
      totals: {
        subtotal,
        totalMrp,
        couponDiscount,
        walletDeducted,
        shipping: 0,
        totalAmount: Math.max(0, finalAmount - walletDeducted),
      },
      paymentMethod,
      paymentStatus: (finalAmount - walletDeducted <= 0 || (paymentMethod && paymentMethod.toUpperCase() === "RAZORPAY")) ? "Paid" : "Pending",
      shippingAddress: { ...addr.toObject() },
      appliedCoupon: appliedCouponCode,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature
    });

    // 6. DEBIT WALLET & UPDATE STOCK
    if (walletDeducted > 0) {
      wallet.balance -= walletDeducted;
      wallet.transactions.push({
        amount: walletDeducted,
        type: "DEBIT",
        reason: "ORDER_PAYMENT",
        orderId: newOrder.orderId,
      });
      await wallet.save();
    }

    for (const item of rawItems) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { stock: -item.quantity },
      });
    }
    if (!buyNowItem) await Cart.findOneAndUpdate({ userId }, { items: [] });

    // 7. CREATE TRANSACTION RECORD
    const user = await require("../../models/User").findById(userId);
    const paymentStatus = finalAmount - walletDeducted <= 0 ? "Success" : (paymentMethod.toUpperCase() === "RAZORPAY" ? "Success" : "Pending");
    try {
      await Transaction.create({
        transactionId: "TXN-" + Date.now(),
        orderId: newOrder.orderId,
        user: {
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
          email: user.email
        },
        paymentMethod,
        amount: newOrder.totals.totalAmount,
        status: paymentStatus,
      });
    } catch (txnErr) {
      console.error("Transaction record creation failed (non-critical):", txnErr.message);
    }

    // 8. ASYNC EMAIL
    sendOrderConfirmationEmail(user, newOrder).catch((err) =>
      console.error("Email Error:", err),
    );

    res
      .status(200)
      .json({
        success: true,
        orderId: newOrder.orderId,
        dbOrderId: newOrder._id,
        totals: newOrder.totals
      });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = placeOrder;
