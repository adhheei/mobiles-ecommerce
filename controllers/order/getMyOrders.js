const Order = require("../../models/Order");

const getMyOrders = async (req, res) => {
    try {
        // This is the correct way
const orders = await Order.find({ userId: req.user._id }).populate('items.productId').sort({
            createdAt: -1,
        });

        res.status(200).json({
            success: true,
            count: orders.length,
            orders: orders.map((order) => ({
                _id: order._id,
                orderId: order.orderId,
                date: order.createdAt,
                totalAmount: order.totals.totalAmount,
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

module.exports = getMyOrders;