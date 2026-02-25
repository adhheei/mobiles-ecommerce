const Order = require("../models/Order");
const PDFDocument = require("pdfkit");

const downloadInvoice = async (req, res) => {
  try {
    const { orderId } = req.params;

    // Fetch the order from the database
    const order = await Order.findById(orderId);
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    // Initialize PDF Document
    const doc = new PDFDocument({ margin: 50 });

    // Set Response Headers for PDF Download
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=Invoice_${order.orderId}.pdf`,
    );

    // Pipe the PDF document directly to the response stream
    doc.pipe(res);

    // --- 1. Header Section ---
    doc.fillColor("#444444").fontSize(20).text("JINSA MOBILES", 50, 57);
    doc.fontSize(10).text("Order Invoice", 200, 65, { align: "right" });
    doc.moveDown();
    doc.moveTo(50, 80).lineTo(550, 80).stroke();

    // --- 2. Order Information ---
    doc
      .fillColor("#000000")
      .fontSize(12)
      .text(`Order ID: ${order.orderId}`, 50, 100);
    doc.text(
      `Date: ${new Date(order.createdAt).toLocaleDateString()}`,
      50,
      115,
    );
    doc.text(`Status: ${order.orderStatus}`, 50, 130);

    // Shipping Info
    doc.text("Shipping Address:", 300, 100);
    doc.fontSize(10).text(`${order.shippingAddress.fullName}`, 300, 115);
    doc.text(`${order.shippingAddress.street}`, 300, 125);
    doc.text(
      `${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.pincode}`,
      300,
      135,
    );
    doc.moveDown();

    // --- 3. Items Table Header ---
    const tableTop = 200;
    doc.font("Helvetica-Bold").fontSize(10);
    doc.text("Product Name", 50, tableTop);
    doc.text("Quantity", 300, tableTop, { width: 50, align: "right" });
    doc.text("Price", 380, tableTop, { width: 70, align: "right" });
    doc.text("Total", 480, tableTop, { width: 70, align: "right" });

    doc
      .moveTo(50, tableTop + 15)
      .lineTo(550, tableTop + 15)
      .stroke();
    doc.font("Helvetica").fontSize(10);

    // --- 4. Items List ---
    let currentY = tableTop + 30;
    order.items.forEach((item) => {
      doc.text(item.name, 50, currentY, { width: 230 });
      doc.text(item.quantity.toString(), 300, currentY, {
        width: 50,
        align: "right",
      });
      doc.text(`Rs. ${item.price.toLocaleString()}`, 380, currentY, {
        width: 70,
        align: "right",
      });
      doc.text(
        `Rs. ${(item.price * item.quantity).toLocaleString()}`,
        480,
        currentY,
        { width: 70, align: "right" },
      );
      currentY += 25;
    });

    // --- 5. Totals Section ---
    const footerTop = Math.max(currentY + 20, 400); // Ensure it doesn't overlap
    doc.moveTo(350, footerTop).lineTo(550, footerTop).stroke();

    doc.fontSize(10).text("Subtotal:", 350, footerTop + 10);
    doc.text(
      `Rs. ${order.totals.subtotal.toLocaleString()}`,
      480,
      footerTop + 10,
      { align: "right" },
    );

    doc.text("Discount:", 350, footerTop + 25);
    doc.text(
      `- Rs. ${order.totals.couponDiscount.toLocaleString()}`,
      480,
      footerTop + 25,
      { align: "right" },
    );

    doc
      .font("Helvetica-Bold")
      .fontSize(12)
      .text("Grand Total:", 350, footerTop + 45);
    doc.text(
      `Rs. ${order.totals.totalAmount.toLocaleString()}`,
      480,
      footerTop + 45,
      { align: "right" },
    );

    // Finalize PDF
    doc.end();
  } catch (error) {
    console.error("Error generating invoice:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// @desc    Get logged in user's orders
// @route   GET /api/orders
// @access  Private
const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user._id }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      count: orders.length,
      orders: orders.map((order) => ({
        _id: order._id, // DB ID
        orderId: order.orderId, // Display ID
        date: order.createdAt,
        totalAmount: order.totals.totalAmount, // Grand total
        status: order.orderStatus,
        itemsCount: order.items.length,
        firstItemName: order.items[0] ? order.items[0].name : "Product",
      })),
    });
  } catch (error) {
    console.error("Get My Orders Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Get order details
// @route   GET /api/orders/:id
// @access  Private
const getOrderDetails = async (req, res) => {
  try {
    // Find by DB ID or Order ID
    const order = await Order.findOne({
      _id: req.params.id,
      userId: req.user._id,
    }).lean();

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    console.error("Get Order Details Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Cancel order (Full or Item)
// @route   PUT /api/orders/:id/cancel
// @access  Private
// @desc    Cancel or Return order (Full or Item)
// @route   PUT /api/orders/:id/cancel
// @access  Private
const cancelOrder = async (req, res) => {
  try {
    const { itemId, action } = req.body; // action: 'cancel' (default) or 'return'
    const Wallet = require("../models/Wallet"); // Ensure Wallet is imported

    const order = await Order.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const targetStatus = action === "return" ? "Returned" : "Cancelled";

    // Validation based on current status
    if (action === "return") {
      if (order.orderStatus !== "Delivered") {
        return res
          .status(400)
          .json({ message: "Can only return delivered orders" });
      }
    } else {
      // Cancel logic
      if (
        ["Delivered", "Cancelled", "Returned", "Shipped"].includes(
          order.orderStatus,
        )
      ) {
        if (
          order.orderStatus === "Delivered" ||
          order.orderStatus === "Cancelled" ||
          order.orderStatus === "Returned"
        ) {
          return res.status(400).json({
            message: `Cannot cancel order in ${order.orderStatus} state`,
          });
        }
      }
    }

    let totalRefundAmount = 0;

    if (itemId) {
      // --- Specific Item Cancellation/Return ---
      const item = order.items.id(itemId);
      if (!item)
        return res.status(404).json({ message: "Item not found in order" });

      if (item.status === "Cancelled" || item.status === "Returned") {
        return res.status(400).json({ message: "Item already processed" });
      }

      // Use the pre-calculated totalItemPrice for refund
      totalRefundAmount = item.totalItemPrice;
      item.status = targetStatus;

      // Check if all items are same status to update main order status
      const allSame = order.items.every((i) => i.status === targetStatus);
      if (allSame) {
        order.orderStatus = targetStatus;
      }
    } else {
      // --- Full Order Cancellation/Return ---
      if (
        order.orderStatus === "Cancelled" ||
        order.orderStatus === "Returned"
      ) {
        return res.status(400).json({ message: "Order already processed" });
      }

      // Calculate total refund from all items that aren't already terminal
      order.items.forEach((item) => {
        if (item.status !== "Cancelled" && item.status !== "Returned") {
          totalRefundAmount += item.totalItemPrice;
          item.status = targetStatus;
        }
      });
      order.orderStatus = targetStatus;
    }

    // --- REFUND LOGIC ---
    // If order was paid (Online or Wallet), credit back to wallet
    if (order.paymentStatus === "Paid" && totalRefundAmount > 0) {
      let wallet = await Wallet.findOne({ userId: req.user._id });

      if (!wallet) {
        wallet = new Wallet({
          userId: req.user._id,
          balance: 0,
          transactions: [],
        });
      }

      wallet.balance += totalRefundAmount;
      wallet.transactions.push({
        userId: req.user._id,
        amount: totalRefundAmount,
        type: "CREDIT",
        reason: "REFUND", // Matches your Wallet schema reason enum
        orderId: order.orderId,
        createdAt: new Date(),
      });

      await wallet.save();

      // Update payment status if full order is processed
      if (
        order.orderStatus === "Returned" ||
        order.orderStatus === "Cancelled"
      ) {
        order.paymentStatus = "Refunded";
      } else {
        order.paymentStatus = "Partially Refunded";
      }
    }

    await order.save();

    res.status(200).json({
      success: true,
      message: `Order ${action === "return" ? "returned" : "cancelled"} successfully. Rs. ${totalRefundAmount} refunded to wallet.`,
      orderStatus: order.orderStatus,
      refundedAmount: totalRefundAmount,
    });
  } catch (error) {
    console.error("Cancel/Return Order Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Get order details (Admin)
// @route   GET /api/admin/orders/:id
// @access  Private/Admin
const getAdminOrderDetails = async (req, res) => {
  try {
    const orderId = req.params.id;

    if (orderId) {
      // Populate userId to get actual customer name and email
      const order = await Order.findById(orderId).populate(
        "userId",
        "firstName lastName email mobile createdAt isBlocked",
      );
      if (!order)
        return res
          .status(404)
          .json({ success: false, message: "Order not found" });
      return res.status(200).json({ success: true, order });
    }

    // For the general list, populate userId for all orders
    const orders = await Order.find()
      .populate("userId", "firstName lastName email")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update order status (Admin)
// @route   PUT /api/admin/orders/:id/status
// @access  Private/Admin
const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const { id } = req.params;

    let query;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      query = { _id: id };
    } else {
      query = { orderId: id };
    }

    const order = await Order.findOne(query);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Validate status transition if needed (optional for now)
    order.orderStatus = status;

    // If delivered, update payment status if COD, and set deliveredAt
    if (status === "Delivered") {
      if (order.paymentMethod === "COD") {
        order.paymentStatus = "Paid";
      }
      order.deliveredAt = Date.now();
    }

    // Update item statuses
    // If the main order status changes, we generally want to update the items too.
    const terminalStatuses = ["Cancelled", "Returned"];

    if (terminalStatuses.includes(status)) {
      // If the entire order is Cancelled or Returned, marks all items as such
      order.items.forEach((item) => {
        item.status = status;
      });
    } else {
      // For forward progress (Pending -> Processing -> Shipped -> Delivered)
      // Only update items that are NOT already in a terminal state (Cancelled/Returned)
      order.items.forEach((item) => {
        if (!terminalStatuses.includes(item.status)) {
          item.status = status;
        }
      });
    }

    await order.save();

    res.status(200).json({
      success: true,
      message: "Order status updated",
      order,
    });
  } catch (error) {
    console.error("Update Order Status Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Request return for an order item
// @route   POST /api/orders/:id/return/:itemId
// @access  Private
const requestReturn = async (req, res) => {
  try {
    const { reason } = req.body;
    const { id, itemId } = req.params;

    const order = await Order.findOne({ _id: id, userId: req.user._id });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.orderStatus !== "Delivered") {
      return res
        .status(400)
        .json({ message: "Return can only be requested for delivered orders" });
    }

    const item = order.items.id(itemId);
    if (!item) {
      return res.status(404).json({ message: "Item not found in order" });
    }

    if (item.returnStatus !== "None") {
      return res
        .status(400)
        .json({ message: "Return request already submitted or processed" });
    }

    item.returnStatus = "Requested";
    item.returnReason = reason;

    await order.save();

    res.status(200).json({
      success: true,
      message: "Return request submitted successfully",
      order,
    });
  } catch (error) {
    console.error("Return Request Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Handle return request (Approve/Reject) with Proportional Wallet Refund
// @route   PATCH /api/admin/orders/:id/return/:itemId
// @access  Private/Admin
const handleReturnRequest = async (req, res) => {
  try {
    const { status } = req.body; // 'Approved' or 'Rejected'
    const { id, itemId } = req.params;
    const Wallet = require("../models/Wallet"); // Ensure Wallet model is imported

    if (!["Approved", "Rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const item = order.items.id(itemId);
    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    // Prevent double-processing if already Approved or Rejected
    if (item.returnStatus === "Approved" || item.returnStatus === "Rejected") {
      return res
        .status(400)
        .json({ message: "Return request already processed" });
    }

    item.returnStatus = status;

    if (status === "Approved") {
      item.status = "Returned";

      // --- WALLET REFUND LOGIC ---
      // Use the pre-calculated proportional net price stored during checkout
      const refundAmount = item.totalItemPrice;

      if (refundAmount > 0) {
        let wallet = await Wallet.findOne({ userId: order.userId });

        // Create wallet if it doesn't exist
        if (!wallet) {
          wallet = new Wallet({
            userId: order.userId,
            balance: 0,
            transactions: [],
          });
        }

        // Credit the refund amount
        wallet.balance += refundAmount;
        wallet.transactions.push({
          userId: order.userId,
          amount: refundAmount,
          type: "CREDIT",
          reason: "REFUND", // Aligns with your Wallet schema enum
          orderId: order.orderId,
          createdAt: new Date(),
        });

        await wallet.save();

        // Update Order-level payment status to reflect partial or full refund
        const allItemsTerminal = order.items.every(
          (i) => i.status === "Returned" || i.status === "Cancelled",
        );
        order.paymentStatus = allItemsTerminal
          ? "Refunded"
          : "Partially Refunded";
      }

      // Optional: Restock logic here if needed
      // const Product = require("../models/Product");
      // await Product.findByIdAndUpdate(item.productId, { $inc: { stock: item.quantity } });
    }

    // Check if all items are returned to update main order status
    const allReturned = order.items.every((i) => i.status === "Returned");
    if (allReturned) {
      order.orderStatus = "Returned";
    }

    await order.save();

    res.status(200).json({
      success: true,
      message: `Return request ${status}. Rs. ${item.totalItemPrice} refunded to wallet.`,
      order,
    });
  } catch (error) {
    console.error("Admin Return Handle Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

module.exports = {
  downloadInvoice,
  getMyOrders,
  getOrderDetails,
  cancelOrder,
  getAdminOrderDetails,
  updateOrderStatus,
  requestReturn,
  handleReturnRequest,
};
