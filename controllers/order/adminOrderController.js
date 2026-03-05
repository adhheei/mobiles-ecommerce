const Order = require("../../models/Order");

const getAdminOrderDetails = async (req, res) => {
    try {
        const orderId = req.params.id;
        if (orderId) {
            const order = await Order.findById(orderId)
                .populate("userId", "firstName lastName email phone createdAt isBlocked")
                .populate("items.productId", "mainImage");
            if (!order) return res.status(404).json({ success: false, message: "Order not found" });

            let totalOrders = 0;
            if (order.userId) {
                totalOrders = await Order.countDocuments({ userId: order.userId._id });
            }

            return res.json({ success: true, order, totalOrders });
        }
        const orders = await Order.find().populate("userId", "firstName lastName email").sort({ createdAt: -1 });
        res.json({ success: true, orders });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const updateOrderStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const id = req.params.id;
        const query = id.match(/^[0-9a-fA-F]{24}$/) ? { _id: id } : { orderId: id };

        const order = await Order.findOne(query);
        if (!order) return res.status(404).json({ message: "Order not found" });

        order.orderStatus = status;
        if (status === "Delivered") {
            if (order.paymentMethod === "COD") order.paymentStatus = "Paid";
            order.deliveredAt = Date.now();
        }

        const terminalStatuses = ["Cancelled", "Returned"];
        order.items.forEach(item => {
            if (terminalStatuses.includes(status) || !terminalStatuses.includes(item.status)) {
                item.status = status;
            }
        });

        await order.save();
        res.json({ success: true, message: "Status updated", order });
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
};

module.exports = { getAdminOrderDetails, updateOrderStatus };