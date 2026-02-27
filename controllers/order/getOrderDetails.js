const Order = require("../../models/Order");

const getOrderDetails = async (req, res) => {
    try {
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

module.exports = getOrderDetails;