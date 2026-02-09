const Order = require("../models/Order");
const Product = require("../models/Product");
const User = require("../models/User");

exports.getDashboardStats = async (req, res) => {
  try {
    // 1. Calculate Total Revenue from delivered orders
    const revenueData = await Order.aggregate([
      { $match: { status: "Delivered" } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]);

    // 2. Count Orders and Customers
    const totalOrders = await Order.countDocuments();
    const totalCustomers = await User.countDocuments({ role: "user" });

    // 3. Calculate Stock Stats safely
    const products = await Product.find({});

    // Using a fallback of 0 ensures the calculation doesn't crash if 'stock' is missing
    const totalInStock = products.reduce((acc, p) => acc + (p.stock || 0), 0);
    const outOfStockCount = products.filter((p) => (p.stock || 0) === 0).length;

    res.json({
      success: true,
      stats: {
        totalRevenue: revenueData.length > 0 ? revenueData[0].total : 0,
        totalOrders,
        totalCustomers,
        productsInStock: totalInStock,
        outOfStock: outOfStockCount,
      },
    });
  } catch (err) {
    console.error("Dashboard Stats Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};
