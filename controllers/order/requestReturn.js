const Order = require("../../models/Order");

const requestReturn = async (req, res) => {
    try {
        const { reason } = req.body;
        const { id, itemId } = req.params;

        const order = await Order.findOne({ _id: id, userId: req.user._id });

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        if (order.orderStatus !== "Delivered") {
            return res.status(400).json({ message: "Return can only be requested for delivered orders" });
        }

        const item = order.items.id(itemId);
        if (!item) {
            return res.status(404).json({ message: "Item not found in order" });
        }

        if (item.returnStatus !== "None") {
            return res.status(400).json({ message: "Return request already submitted or processed" });
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

module.exports = requestReturn;