const Order = require("../models/Order");
const Product = require("../models/Product");
const User = require("../models/User");

exports.getDashboardStats = async (req, res) => {
  try {
    // 1. Revenue: Check if your status is 'Delivered' or 'delivered'
    const revenueData = await Order.aggregate([
      { $match: { orderStatus: "Delivered" } },
      { $group: { _id: null, total: { $sum: "$totals.totalAmount" } } }
    ]);

    // 2. Customers: Ensure the role field exists
    const totalCustomers = await User.countDocuments({ role: 'user' });

    // 3. Stock: Summing up actual quantity
    const stockData = await Product.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: "$stock" },
          outOfStock: { $sum: { $cond: [{ $eq: ["$stock", 0] }, 1, 0] } }
        }
      }
    ]);

    // 4. Graph Data: Monthly revenue for the current year
    const graphData = await Order.aggregate([
      {
        $match: {
          orderStatus: "Delivered",
          createdAt: { $gte: new Date(new Date().getFullYear(), 0, 1) }
        }
      },
      {
        $group: {
          _id: { $month: "$createdAt" },
          revenue: { $sum: "$totals.totalAmount" }
        }
      },
      { $sort: { "_id": 1 } } // Sort by month (1=Jan, 12=Dec)
    ]);

    res.json({
      success: true,
      stats: {
        totalRevenue: revenueData[0]?.total || 0,
        totalOrders: await Order.countDocuments(),
        totalCustomers,
        productsInStock: stockData[0]?.total || 0,
        outOfStock: stockData[0]?.outOfStock || 0,
        graphData // Send the computed graph data
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
