const mongoose = require('mongoose');
const Order = require('./models/Order');
require('dotenv').config();

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        const latestOrder = await Order.findOne().sort({ createdAt: -1 });
        if (latestOrder) {
            console.log("Latest Order ID:", latestOrder.orderId);
            if (latestOrder.items && latestOrder.items.length > 0) {
                console.log("First Item Image:", latestOrder.items[0].image);
                console.log("First Item Name:", latestOrder.items[0].name);
            } else {
                console.log("No items in order.");
            }
        } else {
            console.log("No orders found.");
        }

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

connectDB();
