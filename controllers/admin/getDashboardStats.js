const Order = require("../../models/Order");
const Product = require("../../models/Product");
const User = require("../../models/User");

const getDashboardStats = async (req, res) => {
  try {
    // 1. Total Revenue - Include Processing, Shipped, and Delivered
    const revenueData = await Order.aggregate([
      { 
        $match: { 
          orderStatus: { $in: ["Processing", "Shipped", "Delivered"] } // ✅ Include March orders
        } 
      },
      { $group: { _id: null, total: { $sum: "$totals.totalAmount" } } }
    ]);

    // 2. Customers
    const totalCustomers = await User.countDocuments({ role: 'user' });

    // 3. Stock Stats
    const stockData = await Product.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: "$stock" },
          outOfStock: { $sum: { $cond: [{ $eq: ["$stock", 0] }, 1, 0] } }
        }
      }
    ]);

    // 4. Monthly Graph Data - Fixed to include active March orders
    const graphData = await Order.aggregate([
      {
        $match: {
          orderStatus: { $in: ["Processing", "Shipped", "Delivered"] }, // ✅ Fixed
          createdAt: { $gte: new Date(new Date().getFullYear(), 0, 1) }
        }
      },
      {
        $group: {
          _id: { $month: "$createdAt" },
          revenue: { $sum: "$totals.totalAmount" }
        }
      },
      { $sort: { "_id": 1 } }
    ]);

    // 5. Recent Orders & Overall Count
    const [recentOrders, totalOrdersCount] = await Promise.all([
        Order.find().sort({ createdAt: -1 }).limit(5).populate("userId", "firstName lastName"),
        Order.countDocuments()
    ]);

    res.json({
      success: true,
      stats: {
        totalRevenue: revenueData[0]?.total || 0,
        totalOrders: totalOrdersCount,
        totalCustomers,
        productsInStock: stockData[0]?.total || 0,
        outOfStock: stockData[0]?.outOfStock || 0,
        graphData,
        recentOrders
      }
    });
  } catch (err) {
    console.error("Dashboard Stats Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = getDashboardStats;