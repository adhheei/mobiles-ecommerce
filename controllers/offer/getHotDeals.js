// controllers/offer/getHotDeals.js
const Product = require("../../models/Product");

const getHotDeals = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 0; // 0 means no limit

    let query = Product.find({
      status: "active",
      visibility: "public",
      $expr: { $lt: ["$offerPrice", "$actualPrice"] }
    }).populate("category");

    if (limit > 0) {
      query = query.limit(limit);
    }

    const products = await query;

    const Offer = require("../../models/Offer");
    // Get all Active offers
    const activeOffers = await Offer.find({ status: "Active" });

    const deals = products.map((product) => {
      // Calculate frontend discount percentage natively from final price difference
      const discountPercentage = Math.round(
        ((product.actualPrice - product.offerPrice) / product.actualPrice) * 100
      );

      // Determine if this product is part of a Fixed Amount Offer
      let isFlat = false;
      let flatDiscountValue = 0;

      const matchedOffer = activeOffers.find(offer =>
        (offer.offerType === "Product" && offer.targetId.toString() === product._id.toString()) ||
        (offer.offerType === "Category" && product.category && offer.targetId.toString() === product.category._id.toString())
      );

      if (matchedOffer && matchedOffer.discountType === "fixed") {
        isFlat = true;
        flatDiscountValue = matchedOffer.discountValue;
      }

      return {
        ...product._doc,
        // Always provide an effective percentage for the frontend UI badge for basic checks
        discountPercentage: discountPercentage > 0 ? discountPercentage : 0,
        isFlat,
        flatDiscountValue,
        discountType: matchedOffer ? matchedOffer.discountType : (discountPercentage > 0 ? "percentage" : null),
        discountValue: matchedOffer ? matchedOffer.discountValue : discountPercentage
      };
    });

    res.status(200).json({ success: true, deals: deals });
  } catch (error) {
    console.error("Hot Deals Error:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

module.exports = { getHotDeals };
