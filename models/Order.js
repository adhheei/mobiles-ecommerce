const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  orderId: {
    type: String, // Custom friendly ID e.g. ORD-123456
    required: true,
    unique: true,
  },
  items: [
    {
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
      },
      name: { type: String, required: true },
      image: { type: String },
      price: { type: Number, required: true }, // Selling Price (before coupon)
      mrp: { type: Number }, // Original MRP
      quantity: { type: Number, required: true },

      // --- NEW FIELDS FOR PROPORTIONAL REFUND ---
      discountPerItem: {
        type: Number,
        default: 0,
      }, // The specific portion of the coupon discount for ONE unit of this item
      totalItemPrice: {
        type: Number,
        required: true,
      }, // (Price - discountPerItem) * quantity (The actual amount paid for this line item)

      status: {
        type: String,
        enum: ["Processing", "Shipped", "Delivered", "Cancelled", "Returned"],
        default: "Processing",
      },
      returnStatus: {
        type: String,
        enum: ["None", "Requested", "Approved", "Rejected"],
        default: "None",
      },
      returnReason: {
        type: String,
        default: "",
      },
      paymentStatus: {
        type: String,
        enum: ["Pending", "Paid", "Refunded"],
        default: "Pending",
      },
    },
  ],
  shippingAddress: {
    type: Object,
    required: true,
  },
  paymentMethod: {
    type: String,
    required: true,
  },
  paymentStatus: {
    type: String,
    enum: ["Pending", "Paid", "Failed", "Refunded", "Partially Refunded"], // Added Partially Refunded
    default: "Pending",
  },
  totals: {
    subtotal: Number, // Total Selling Price
    totalMrp: Number, // Total MRP
    productDiscount: Number, // MRP - Selling Price
    couponDiscount: Number,
    walletDeducted: Number,
    shipping: Number,
    totalAmount: Number, // Grand Total (Actual amount collected from user)
  },
  orderStatus: {
    // Overall Order Status
    type: String,
    enum: ["Processing", "Shipped", "Delivered", "Cancelled", "Returned"],
    default: "Processing",
  },
  appliedCoupon: { type: String },

  // --- RAZORPAY TRACKING ---
  razorpayOrderId: { type: String },
  razorpayPaymentId: { type: String },
  razorpaySignature: { type: String },

  createdAt: {
    type: Date,
    default: Date.now,
  },
  deliveredAt: {
    type: Date,
  },
});

// Middleware to prevent negative total amounts
orderSchema.pre("save", async function () {
  if (this.totals.totalAmount < 0) this.totals.totalAmount = 0;
});

module.exports = mongoose.model("Order", orderSchema);
