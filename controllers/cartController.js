const Order = require("../models/Order");
const Wallet = require("../models/Wallet");
const Product = require("../models/Product");
const Cart = require("../models/Cart");
const Coupon = require("../models/Coupon");
const Address = require("../models/Address");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

// --- HELPER FUNCTIONS ---

// Helper to format image path
const formatImageUrl = (filePath) => {
  if (!filePath) return "https://placehold.co/100x120/f0f0f0/333?text=No+Image";
  return (
    "/" +
    filePath
      .replace(/\\/g, "/")
      .replace(/^public\//, "")
      .replace(/^\//, "")
  );
};

// Helper: Format Cart for Frontend
function formatCart(cart) {
  let subtotal = 0;
  let totalMrp = 0;

  const items = cart.items
    .map((item) => {
      const product = item.productId;
      if (!product) return null;

      const price = product.offerPrice || product.price || 0;
      const mrp = product.actualPrice || product.price || 0;
      const lineTotal = price * item.quantity;

      subtotal += lineTotal;
      totalMrp += mrp * item.quantity;

      return {
        productId: product._id,
        name: product.productName || product.name,
        image: product.mainImage
          ? formatImageUrl(product.mainImage)
          : "https://placehold.co/100x120/f0f0f0/333?text=No+Image",
        color: product.color,
        price: price,
        mrp: mrp,
        quantity: item.quantity,
        stock: product.stock,
        lineTotal: lineTotal,
      };
    })
    .filter((i) => i !== null);

  const discount = totalMrp - subtotal;

  return {
    items,
    subtotal,
    totalMrp,
    discount,
    totalAmount: subtotal,
  };
}

// --- CART ACTIONS ---

const getCart = async (req, res) => {
  try {
    const userId = req.user.id;
    let cart = await Cart.findOne({ userId }).populate("items.productId");

    if (!cart) {
      return res.status(200).json({
        cart: {
          items: [],
          subtotal: 0,
          totalMrp: 0,
          discount: 0,
          totalAmount: 0,
        },
      });
    }

    cart.items = cart.items.filter((item) => item.productId);
    res.status(200).json(formatCart(cart));
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const addToCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId, quantity } = req.body;
    const qty = parseInt(quantity) || 1;

    let cart = await Cart.findOne({ userId });
    if (!cart) cart = new Cart({ userId, items: [] });

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });

    const itemIndex = cart.items.findIndex(
      (p) => p.productId.toString() === productId,
    );
    let newQuantity =
      itemIndex > -1 ? cart.items[itemIndex].quantity + qty : qty;

    if (product.stock < newQuantity) {
      return res
        .status(400)
        .json({
          message: `Insufficient stock. Only ${product.stock} units available.`,
        });
    }

    if (itemIndex > -1) cart.items[itemIndex].quantity = newQuantity;
    else cart.items.push({ productId, quantity: qty });

    await cart.save();
    res.status(200).json({ message: "Product added to cart" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const updateCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId, quantity } = req.body;
    const qty = parseInt(quantity);

    if (qty < 1)
      return res.status(400).json({ message: "Quantity must be at least 1" });

    const cart = await Cart.findOne({ userId });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    const itemIndex = cart.items.findIndex(
      (p) => p.productId.toString() === productId,
    );
    if (itemIndex > -1) {
      const product = await Product.findById(productId);
      if (product.stock < qty) {
        return res
          .status(400)
          .json({ message: `Only ${product.stock} units available.` });
      }
      cart.items[itemIndex].quantity = qty;
      await cart.save();
      const updatedCart = await Cart.findOne({ userId }).populate(
        "items.productId",
      );
      res.status(200).json({ cart: formatCart(updatedCart) });
    } else {
      res.status(404).json({ message: "Item not found in cart" });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const removeFromCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.params;
    const cart = await Cart.findOne({ userId });
    cart.items = cart.items.filter((p) => p.productId.toString() !== productId);
    await cart.save();
    const updatedCart = await Cart.findOne({ userId }).populate(
      "items.productId",
    );
    res.status(200).json({ cart: formatCart(updatedCart) });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const clearCart = async (req, res) => {
  try {
    const userId = req.user.id;
    await Cart.findOneAndUpdate({ userId }, { items: [] });
    res.status(200).json({ message: "Cart cleared" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const getCartCount = async (req, res) => {
  try {
    const userId = req.user.id;
    const cart = await Cart.findOne({ userId });
    const count = cart
      ? cart.items.reduce((acc, item) => acc + (item.quantity || 0), 0)
      : 0;
    res.status(200).json({ count });
  } catch (error) {
    res.status(200).json({ count: 0 });
  }
};

// --- CHECKOUT LOGIC ---

const placeOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      paymentMethod,
      useWallet,
      addressId,
      buyNowItem,
      couponCode,
      razorpayPaymentId,
      razorpayOrderId,
      razorpaySignature,
    } = req.body;

    // 1. VERIFY RAZORPAY SIGNATURE
    if (paymentMethod === "Razorpay") {
      const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
      hmac.update(razorpayOrderId + "|" + razorpayPaymentId);
      if (hmac.digest("hex") !== razorpaySignature) {
        return res
          .status(400)
          .json({ success: false, message: "Payment verification failed" });
      }
    }

    // 2. GATHER ITEMS AND VERIFY STOCK
    let subtotal = 0;
    let totalMrp = 0;
    let rawItems = [];

    if (buyNowItem) {
      const product = await Product.findById(buyNowItem.productId);
      if (!product || product.stock < buyNowItem.qty) {
        return res.status(400).json({ message: "Product out of stock" });
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
        image: formatImageUrl(product.mainImage),
      });
    } else {
      const cart = await Cart.findOne({ userId }).populate("items.productId");
      if (!cart || cart.items.length === 0)
        return res.status(400).json({ message: "Cart is empty" });

      for (const item of cart.items) {
        if (item.productId.stock < item.quantity) {
          return res
            .status(400)
            .json({ message: `${item.productId.name} is out of stock` });
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
          image: formatImageUrl(item.productId.mainImage),
        });
      }
    }

    // 3. PROCESS COUPON
    let couponDiscount = 0;
    let appliedCouponCode = null;
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

    // --- 4. PROPORTIONAL DISCOUNT DISTRIBUTION ---
    let orderItems = [];
    let distributedDiscountTotal = 0;

    rawItems.forEach((item, index) => {
      let itemCouponDiscount = 0;
      if (couponDiscount > 0) {
        if (index === rawItems.length - 1) {
          itemCouponDiscount = couponDiscount - distributedDiscountTotal;
        } else {
          const itemWeight = (item.price * item.quantity) / subtotal;
          itemCouponDiscount =
            Math.round(itemWeight * couponDiscount * 100) / 100;
          distributedDiscountTotal += itemCouponDiscount;
        }
      }
      orderItems.push({
        ...item,
        discountPerItem:
          Math.round((itemCouponDiscount / item.quantity) * 100) / 100,
        totalItemPrice: item.price * item.quantity - itemCouponDiscount,
        status: "Processing",
      });
    });

    // 5. HANDLE WALLET
    let finalAmount = subtotal - couponDiscount;
    let walletDeducted = 0;
    if (useWallet) {
      const wallet = await Wallet.findOne({ userId });
      if (wallet && wallet.balance > 0) {
        walletDeducted = Math.min(wallet.balance, finalAmount);
        wallet.balance -= walletDeducted;
        wallet.transactions.push({
          amount: walletDeducted,
          type: "DEBIT",
          reason: "ORDER_PAYMENT",
          orderId: "ORD-" + Date.now(),
        });
        await wallet.save();
        finalAmount -= walletDeducted;
      }
    }

    // 6. CREATE ORDER
    const addr = await Address.findById(addressId);
    const newOrder = await Order.create({
      userId,
      orderId: "ORD-" + Date.now(),
      items: orderItems,
      totals: {
        subtotal,
        totalMrp,
        productDiscount: totalMrp - subtotal,
        couponDiscount,
        walletDeducted,
        totalAmount: Math.max(0, finalAmount),
        shipping: 0,
      },
      paymentMethod,
      paymentStatus:
        paymentMethod === "COD" && finalAmount > 0 ? "Pending" : "Paid",
      shippingAddress: {
        fullName: addr.fullName,
        phone: addr.phone,
        street: addr.street,
        city: addr.city,
        state: addr.state,
        pincode: addr.pincode,
        country: addr.country,
      },
      appliedCoupon: appliedCouponCode,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    });

    // 7. FINAL STOCK UPDATE & CART CLEANUP
    for (const item of orderItems) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { stock: -item.quantity },
      });
    }
    if (!buyNowItem) await Cart.findOneAndUpdate({ userId }, { items: [] });

    res
      .status(200)
      .json({
        success: true,
        orderId: newOrder.orderId,
        totals: newOrder.totals,
      });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getCart,
  addToCart,
  updateCart,
  removeFromCart,
  clearCart,
  getCartCount,
  placeOrder,
};
