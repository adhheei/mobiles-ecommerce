const Order = require("../../models/Order");
const Wallet = require("../../models/Wallet");

const handleReturnRequest = async (req, res) => {
    try {
        const { status } = req.body; // 'Approved' or 'Rejected'
        const { id, itemId } = req.params;

        if (!["Approved", "Rejected"].includes(status)) {
            return res.status(400).json({ message: "Invalid status" });
        }

        const order = await Order.findById(id);
        if (!order) return res.status(404).json({ message: "Order not found" });

        const item = order.items.id(itemId);
        if (!item) return res.status(404).json({ message: "Item not found" });

        if (item.returnStatus === "Approved" || item.returnStatus === "Rejected") {
            return res.status(400).json({ message: "Return request already processed" });
        }

        item.returnStatus = status;

        if (status === "Approved") {
            item.status = "Returned";

            // REFUND LOGIC: Use totalItemPrice (calculated during checkout)
            const refundAmount = item.totalItemPrice;

            if (refundAmount > 0) {
                let wallet = await Wallet.findOne({ userId: order.userId }) || 
                             new Wallet({ userId: order.userId, balance: 0, transactions: [] });

                wallet.balance += refundAmount;
                wallet.transactions.push({
                    userId: order.userId,
                    amount: refundAmount,
                    type: "CREDIT",
                    reason: "REFUND",
                    orderId: order.orderId,
                    createdAt: new Date(),
                });

                await wallet.save();

                // Update Order payment status
                const allItemsTerminal = order.items.every(
                    (i) => i.status === "Returned" || i.status === "Cancelled"
                );
                order.paymentStatus = allItemsTerminal ? "Refunded" : "Partially Refunded";
            }
        }

        const allReturned = order.items.every((i) => i.status === "Returned");
        if (allReturned) order.orderStatus = "Returned";

        await order.save();

        res.status(200).json({
            success: true,
            message: `Return request ${status}. Rs. ${item.totalItemPrice} processed.`,
            order,
        });
    } catch (error) {
        console.error("Admin Return Handle Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

module.exports = handleReturnRequest;