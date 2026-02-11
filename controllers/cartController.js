const Order = require("../models/Order");
const Wallet = require("../models/Wallet");
const Product = require("../models/Product");
const Cart = require("../models/Cart");
const crypto = require("crypto");

// Get user cart
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

    // Filter out null products (if product deleted)
    cart.items = cart.items.filter((item) => item.productId);

    const formattedCart = formatCart(cart);
    res.status(200).json(formattedCart);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Add item to cart
const addToCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId, quantity } = req.body;
    const qty = parseInt(quantity) || 1;

    let cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = new Cart({ userId, items: [] });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const itemIndex = cart.items.findIndex(
      (p) => p.productId.toString() === productId,
    );
    let newQuantity = qty;
    if (itemIndex > -1) {
      newQuantity = cart.items[itemIndex].quantity + qty;
    }

    // Check Stock
    if (product.stock < newQuantity) {
      return res.status(400).json({
        message: `Insufficient stock. Only ${product.stock} units available.`,
      });
    }

    if (itemIndex > -1) {
      cart.items[itemIndex].quantity = newQuantity;
    } else {
      cart.items.push({ productId, quantity: qty });
    }

    await cart.save();

    // Return full cart or success message
    // Ideally return formatted cart so frontend can update count/view immediately if needed
    // But for "Add to Cart" button usually just 200 OK is enough
    res.status(200).json({ message: "Product added to cart" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update item quantity
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
      // Fetch the actual product to check live stock
      const product = await Product.findById(productId);
      if (!product)
        return res.status(404).json({ message: "Product no longer exists" });

      // VALIDATION: Check if requested qty exceeds available stock
      if (product.stock < qty) {
        return res.status(400).json({
          message: `Insufficient stock. Only ${product.stock} units available.`,
        });
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
    console.error("Update Cart Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Remove item
const removeFromCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.params;

    const cart = await Cart.findOne({ userId });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    cart.items = cart.items.filter((p) => p.productId.toString() !== productId);
    await cart.save();

    const updatedCart = await Cart.findOne({ userId }).populate(
      "items.productId",
    );
    res.status(200).json({ cart: formatCart(updatedCart) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Clear cart
const clearCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const cart = await Cart.findOne({ userId });
    if (cart) {
      cart.items = [];
      await cart.save();
    }
    res.status(200).json({
      message: "Cart cleared",
      cart: {
        items: [],
        subtotal: 0,
        totalMrp: 0,
        discount: 0,
        totalAmount: 0,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Helper: Format Cart for Frontend
function formatCart(cart) {
  let subtotal = 0;
  let totalMrp = 0;

  const items = cart.items
    .map((item) => {
      const product = item.productId; // Populated
      // Handle product deletion/null case
      if (!product) return null;

      const price = product.offerPrice || product.price || 0;
      const mrp = product.actualPrice || product.price || 0; // Default MRP to price if not set
      const lineTotal = price * item.quantity;

      subtotal += lineTotal;
      totalMrp += mrp * item.quantity;

      // --- DEBUG STOCK ---
      if (product.stock === undefined || product.stock === null) {
        console.warn(
          `[DEBUG] Product Stock Missing for ${product._id}:`,
          product,
        );
      } else {
        console.log(`[DEBUG] Product Stock for ${product._id}:`, product.stock);
      }

      // Image Handling
      let image = "https://placehold.co/100x120/f0f0f0/333?text=No+Image";

      // Helper to format image path
      const formatImageUrl = (filePath) => {
        if (!filePath) return "";
        return (
          "/" +
          filePath
            .replace(/\\/g, "/")
            .replace(/^public\//, "")
            .replace(/^\//, "")
        );
      };

      if (product.mainImage) {
        image = formatImageUrl(product.mainImage);
      } else if (product.productImages && product.productImages.length > 0) {
        image = product.productImages[0];
      }

      return {
        productId: product._id,
        name: product.productName || product.name,
        image: image,
        color: product.color,
        price: price,
        mrp: mrp,
        quantity: item.quantity,
        stock: product.stock, // Add stock info
        lineTotal: lineTotal,
      };
    })
    .filter((i) => i !== null);

  const discount = totalMrp - subtotal;
  const totalAmount = subtotal; // + Shipping if any

  return {
    items,
    subtotal,
    totalMrp,
    discount,
    totalAmount,
  };
}

// Get cart count
const getCartCount = async (req, res) => {
  try {
    const userId = req.user.id;
    const cart = await Cart.findOne({ userId });

    if (!cart || !cart.items) {
      return res.status(200).json({ count: 0 });
    }

    // Sum up quantities
    const count = cart.items.reduce(
      (acc, item) => acc + (item.quantity || 0),
      0,
    );

    res.status(200).json({ count });
  } catch (error) {
    console.error("Get cart count error:", error);
    res.status(200).json({ count: 0 }); // Fallback to 0 on error
  }
};

// Email Transporter (Reuse credentials)
const nodemailer = require("nodemailer");
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

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

// Place Order & Handle Wallet & Coupon
const placeOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { paymentMethod, useWallet, addressId, buyNowItem, couponCode,
      razorpayPaymentId, razorpayOrderId, razorpaySignature } = req.body;

    // 1. VERIFY RAZORPAY SIGNATURE (Security Check)
    if (paymentMethod === 'Razorpay') {
      const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
      hmac.update(razorpayOrderId + "|" + razorpayPaymentId);
      const generatedSignature = hmac.digest('hex');

      if (generatedSignature !== razorpaySignature) {
        return res.status(400).json({ success: false, message: "Payment verification failed" });
      }
    }

    // 2. CALCULATE TOTALS (Supports Buy Now & Cart)
    let subtotal = 0;
    let totalMrp = 0;
    let orderItems = [];

    if (buyNowItem) {
      const product = await Product.findById(buyNowItem.productId);
      const price = product.offerPrice || product.price;
      const mrp = product.actualPrice || product.price;

      subtotal = price * buyNowItem.qty;
      totalMrp = mrp * buyNowItem.qty;

      orderItems.push({
        productId: product._id,
        name: product.name,
        price: price,
        mrp: mrp,
        quantity: buyNowItem.qty,
        image: (product.mainImage || (product.gallery && product.gallery.length > 0 ? product.gallery[0] : null))?.replace(/\\/g, '/')
      });
    } else {
      const cart = await Cart.findOne({ userId }).populate("items.productId");
      cart.items.forEach(item => {
        if (item.productId) {
          const price = item.productId.offerPrice || item.productId.price;
          const mrp = item.productId.actualPrice || item.productId.price;

          subtotal += price * item.quantity;
          totalMrp += mrp * item.quantity;

          orderItems.push({
            productId: item.productId._id,
            name: item.productId.name,
            price: price,
            mrp: mrp,
            quantity: item.quantity,
            image: (item.productId.mainImage || (item.productId.gallery && item.productId.gallery.length > 0 ? item.productId.gallery[0] : null))?.replace(/\\/g, '/')
          });
        }
      });
    }

    // 3. APPLY COUPON
    const Coupon = require("../models/Coupon");
    const Address = require("../models/Address"); // Import Address model
    let couponDiscount = 0;
    let appliedCouponCode = null;

    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode, isActive: true });

      if (coupon) {
        // Validate Coupon Validity
        const now = new Date();
        if (now < coupon.startDate || now > coupon.endDate) {
          // Coupon expired, ignore or error? ignoring for smoother UX, maybe log
          console.warn(`Coupon ${couponCode} expired`);
        } else if (subtotal < coupon.minPurchase) {
          console.warn(`Coupon ${couponCode} min purchase not met`);
        } else if (coupon.totalLimit !== null && coupon.totalUsed >= coupon.totalLimit) {
          console.warn(`Coupon ${couponCode} usage limit reached`);
        } else {
          // Check per user limit
          const userUses = coupon.userUsage.get(userId.toString()) || 0;
          if (userUses >= coupon.perUserLimit) {
            console.warn(`Coupon ${couponCode} user limit reached`);
          } else {
            // VALID COUPON - Calculate Discount
            if (coupon.discountType === 'percentage') {
              couponDiscount = (subtotal * coupon.value) / 100;
              if (coupon.maxDiscount && couponDiscount > coupon.maxDiscount) {
                couponDiscount = coupon.maxDiscount;
              }
            } else {
              couponDiscount = coupon.value;
            }

            // Ensure discount doesn't exceed subtotal
            couponDiscount = Math.min(couponDiscount, subtotal);

            appliedCouponCode = couponCode;

            // Increment usage
            coupon.totalUsed += 1;
            coupon.userUsage.set(userId.toString(), userUses + 1);
            await coupon.save();
          }
        }
      }
    }

    let finalAmount = subtotal - couponDiscount;

    // 4. APPLY WALLET
    let walletDeducted = 0;

    if (useWallet) {
      const wallet = await Wallet.findOne({ userId });
      if (wallet && wallet.balance > 0) {
        walletDeducted = Math.min(wallet.balance, finalAmount);
        wallet.balance -= walletDeducted;
        wallet.transactions.push({ amount: walletDeducted, type: "DEBIT", reason: "Order Payment" });
        await wallet.save();
        finalAmount -= walletDeducted;
      }
    }

    // 5. CREATE ORDER DOCUMENT
    const productDiscount = totalMrp - subtotal;

    const newOrder = await Order.create({
      userId,
      orderId: "ORD-" + Date.now(),
      items: orderItems,
      totals: {
        subtotal,
        totalMrp,
        productDiscount,
        couponDiscount,
        walletDeducted,
        totalAmount: finalAmount,
        shipping: 0
      },
      paymentMethod,
      paymentStatus: (paymentMethod === 'COD' && finalAmount > 0) ? 'Pending' : 'Paid',
      shippingAddress: await (async () => {
        const addr = await Address.findById(addressId);
        if (!addr) {
          throw new Error("Delivery address not found");
        }
        return {
          fullName: addr.fullName,
          phone: addr.phone,
          street: addr.street,
          city: addr.city,
          state: addr.state,
          pincode: addr.pincode,
          country: addr.country
        };
      })(),
      appliedCoupon: appliedCouponCode
    });

    // 6. UPDATE STOCK & CLEAR CART

    // 6. UPDATE STOCK & CLEAR CART
    for (const item of orderItems) {
      await Product.findByIdAndUpdate(item.productId, { $inc: { stock: -item.quantity } });
    }
    if (!buyNowItem) await Cart.findOneAndUpdate({ userId }, { items: [] });

    res.status(200).json({
      success: true,
      orderId: newOrder.orderId,
      dbOrderId: newOrder._id,
      orderItems: newOrder.items,
      totals: newOrder.totals,
      appliedCoupon: appliedCouponCode
    });

  } catch (error) {
    console.error("Order Placement Error:", error);
    res.status(500).json({ message: error.message });
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
