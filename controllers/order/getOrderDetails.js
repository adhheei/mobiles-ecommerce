const mongoose = require("mongoose");
const Order = require("../../models/Order");

const getOrderDetails = async (req, res) => {
    try {
        // Support lookup by MongoDB _id, Razorpay Order ID, or friendly orderId
        const orderId = req.params.id;
        const query = {
            $or: [
                { razorpayOrderId: orderId },
                { orderId: orderId }
            ],
            userId: req.user._id,
        };

        if (mongoose.isValidObjectId(orderId)) {
            query.$or.push({ _id: orderId });
        }

        const order = await Order.findOne(query).lean();

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

module.exports = getOrderDetails;