// controllers/offer/getHotDeals.js
const Product = require("../../models/Product");

const getHotDeals = async (req, res) => {
  try {
    const products = await Product.find({
      status: "active",
      visibility: "public",
      $expr: { $lt: ["$offerPrice", "$actualPrice"] }
    }).populate("category");

    const deals = products.map((product) => {
      // Calculate frontend discount percentage natively
      const discountPercentage = Math.round(
        ((product.actualPrice - product.offerPrice) / product.actualPrice) * 100
      );

      return {
        ...product._doc,
        discountPercentage: discountPercentage > 0 ? discountPercentage : 0,
      };
    });

    res.status(200).json({ success: true, deals: deals });
  } catch (error) {
    console.error("Hot Deals Error:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

module.exports = { getHotDeals };
