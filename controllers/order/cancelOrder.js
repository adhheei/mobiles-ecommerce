const Order = require("../../models/Order");
const Wallet = require("../../models/Wallet");

const cancelOrder = async (req, res) => {
    try {
        const { itemId, action } = req.body; // action: 'cancel' or 'return'
        const order = await Order.findOne({ _id: req.params.id, userId: req.user._id });

        if (!order) return res.status(404).json({ message: "Order not found" });

        const targetStatus = action === "return" ? "Returned" : "Cancelled";

        // Validation logic
        if (action === "return") {
            if (order.orderStatus !== "Delivered") return res.status(400).json({ message: "Can only return delivered orders" });
        } else {
            if (["Delivered", "Cancelled", "Returned", "Shipped"].includes(order.orderStatus)) {
                return res.status(400).json({ message: `Cannot cancel order in ${order.orderStatus} state` });
            }
        }

        let totalRefundAmount = 0;

        if (itemId) {
            const item = order.items.id(itemId);
            if (!item || item.status === "Cancelled" || item.status === "Returned") {
                return res.status(400).json({ message: "Item unavailable or already processed" });
            }
            totalRefundAmount = item.totalItemPrice;
            item.status = targetStatus;
            if (order.items.every(i => i.status === targetStatus)) order.orderStatus = targetStatus;
        } else {
            if (order.orderStatus === "Cancelled" || order.orderStatus === "Returned") {
                return res.status(400).json({ message: "Order already processed" });
            }
            order.items.forEach(item => {
                if (item.status !== "Cancelled" && item.status !== "Returned") {
                    totalRefundAmount += item.totalItemPrice;
                    item.status = targetStatus;
                }
            });
            order.orderStatus = targetStatus;
        }

        // Wallet Refund
        if (order.paymentStatus === "Paid" && totalRefundAmount > 0) {
            let wallet = await Wallet.findOne({ userId: req.user._id }) || new Wallet({ userId: req.user._id, balance: 0 });
            wallet.balance += totalRefundAmount;
            wallet.transactions.push({
                userId: req.user._id, amount: totalRefundAmount, type: "CREDIT",
                reason: "REFUND", orderId: order.orderId, createdAt: new Date()
            });
            await wallet.save();
            order.paymentStatus = (order.orderStatus === "Returned" || order.orderStatus === "Cancelled") ? "Refunded" : "Partially Refunded";
        }

        await order.save();
        res.status(200).json({ success: true, refundedAmount: totalRefundAmount });
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
};

module.exports = cancelOrder;