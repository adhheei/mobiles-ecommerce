const Order = require("../../models/Order");

/**
 * @desc    Update order and item statuses (Admin Only)
 * @route   PUT /api/admin/orders/:id/status
 * @access  Private/Admin
 */
const updateOrderStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const { id } = req.params;

        // Determine if searching by MongoDB _id or custom orderId string
        let query = id.match(/^[0-9a-fA-F]{24}$/) ? { _id: id } : { orderId: id };

        const order = await Order.findOne(query);

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        // 1. Update main order status
        order.orderStatus = status;

        // 2. Handle Delivery specific logic
        if (status === "Delivered") {
            if (order.paymentMethod === "COD") {
                order.paymentStatus = "Paid";
            }
            order.deliveredAt = Date.now();
        }

        // 3. Sync Item Statuses
        const terminalStatuses = ["Cancelled", "Returned"];

        if (terminalStatuses.includes(status)) {
            // If main order is terminal, all items must be terminal
            order.items.forEach((item) => {
                item.status = status;
            });
        } else {
            // Forward progress: Only update items that aren't already Cancelled/Returned
            order.items.forEach((item) => {
                if (!terminalStatuses.includes(item.status)) {
                    item.status = status;
                }
            });
        }

        await order.save();

        res.status(200).json({
            success: true,
            message: "Order status updated successfully",
            order,
        });
    } catch (error) {
        console.error("Update Order Status Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

module.exports = updateOrderStatus;