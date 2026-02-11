const Order = require("../models/Order");

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
        // allow cancel if shipped? usually no, but policy depends. strict: only processing.
        // kept simple: cannot cancel if delivered/cancelled/returned.
        // Note: user policy says "after delivered add return", ensuring shipped cannot simply be cancelled?
        // For now, blocking cancel if delivered/cancelled/returned.
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

    if (itemId) {
      // Specific item
      const item = order.items.id(itemId);
      if (!item)
        return res.status(404).json({ message: "Item not found in order" });

      item.status = targetStatus;

      // Check if all items are same status
      const allSame = order.items.every((i) => i.status === targetStatus);
      if (allSame) {
        order.orderStatus = targetStatus;
      }
    } else {
      // Full Order
      order.orderStatus = targetStatus;
      order.items.forEach((item) => (item.status = targetStatus));
    }

    await order.save();

    if (
      order.paymentStatus === "Paid" &&
      (targetStatus === "Returned" || targetStatus === "Cancelled")
    ) {
      // Refund logic placeholder
    }

    res.status(200).json({
      success: true,
      message: `Order ${action === "return" ? "returned" : "cancelled"} successfully`,
      orderStatus: order.orderStatus,
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
      const order = await Order.findById(orderId).populate('userId', 'firstName lastName email mobile createdAt isBlocked');
      if (!order) return res.status(404).json({ success: false, message: "Order not found" });
      return res.status(200).json({ success: true, order });
    }

    // For the general list, populate userId for all orders
    const orders = await Order.find()
      .populate('userId', 'firstName lastName email')
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

    if (order.orderStatus !== 'Delivered') {
      return res.status(400).json({ message: "Return can only be requested for delivered orders" });
    }

    const item = order.items.id(itemId);
    if (!item) {
      return res.status(404).json({ message: "Item not found in order" });
    }

    if (item.returnStatus !== 'None') {
      return res.status(400).json({ message: "Return request already submitted or processed" });
    }

    item.returnStatus = 'Requested';
    item.returnReason = reason;

    await order.save();

    res.status(200).json({
      success: true,
      message: "Return request submitted successfully",
      order
    });

  } catch (error) {
    console.error("Return Request Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Handle return request (Approve/Reject)
// @route   PATCH /api/admin/orders/:id/return/:itemId
// @access  Private/Admin
const handleReturnRequest = async (req, res) => {
  try {
    const { status } = req.body; // 'Approved' or 'Rejected'
    const { id, itemId } = req.params;

    if (!['Approved', 'Rejected'].includes(status)) {
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

    item.returnStatus = status;

    if (status === 'Approved') {
      item.status = 'Returned';
      // Optional: Restock logic here if needed
    }

    // Check if all items are returned to update main order status
    const allReturned = order.items.every(i => i.status === 'Returned');
    if (allReturned) {
      order.orderStatus = 'Returned';
    }

    await order.save();

    res.status(200).json({
      success: true,
      message: `Return request ${status}`,
      order
    });

  } catch (error) {
    console.error("Admin Return Handle Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

module.exports = {
  getMyOrders,
  getOrderDetails,
  cancelOrder,
  getAdminOrderDetails,
  updateOrderStatus,
  requestReturn,
  handleReturnRequest
};
