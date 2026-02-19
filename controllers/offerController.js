const Offer = require("../models/Offer");
const Product = require("../models/Product");
const Category = require("../models/Category");
const path = require("path");

// GET all offers for the admin table
exports.getAllOffers = async (req, res) => {
  try {
    const offers = await Offer.find({ status: "Active" })
      .populate("targetId")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, offers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateOffer = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      discountPercentage,
      offerType,
      targetId,
      startDate,
      endDate,
      status,
    } = req.body;

    const updatedOffer = await Offer.findByIdAndUpdate(
      id,
      {
        name,
        discountPercentage,
        offerType,
        targetId,
        startDate,
        endDate,
        status,
      },
      { new: true },
    );

    if (!updatedOffer)
      return res
        .status(404)
        .json({ success: false, message: "Offer not found" });

    // Recalculate prices if the offer is Active
    if (status === "Active") {
      await updateProductPrices(offerType, targetId, discountPercentage);
    }

    res
      .status(200)
      .json({ success: true, message: "Offer updated successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Internal helper to update prices when an offer is added/edited
const updateProductPrices = async (offerType, targetId, discountPercentage) => {
  if (offerType === "Category") {
    const products = await Product.find({ category: targetId });
    const updatePromises = products.map((product) => {
      product.offerPrice = Math.round(
        product.actualPrice * (1 - discountPercentage / 100),
      );
      return product.save();
    });
    await Promise.all(updatePromises);
  } else {
    const product = await Product.findById(targetId);
    if (product) {
      product.offerPrice = Math.round(
        product.actualPrice * (1 - discountPercentage / 100),
      );
      await product.save();
    }
  }
};

// POST add a new offer
exports.addOffer = async (req, res) => {
  try {
    const {
      name,
      discountPercentage,
      offerType,
      targetId,
      startDate,
      endDate,
    } = req.body;
    const newOffer = new Offer({
      name,
      discountPercentage,
      offerType,
      targetId,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
    });
    await newOffer.save();

    await updateProductPrices(offerType, targetId, discountPercentage);

    res
      .status(201)
      .json({ success: true, message: "Offer created and prices updated" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE an offer
exports.deleteOffer = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Find the offer first to get associated products/category
    const offer = await Offer.findById(id);
    if (!offer) {
      return res
        .status(404)
        .json({ success: false, message: "Offer not found" });
    }

    // 2. Reset product prices before deleting the offer
    // This stops the 'undefined' price issues in the shop
    if (offer.targetType === "Product") {
      await Product.updateMany(
        { _id: { $in: offer.targetIds } },
        { $set: { offerPrice: undefined } }, // Reverts to actualPrice logic
      );
    } else if (offer.targetType === "Category") {
      await Product.updateMany(
        { category: offer.targetIds[0] },
        { $set: { offerPrice: undefined } },
      );
    }

    // 3. Delete the offer document
    await Offer.findByIdAndDelete(id);

    res.json({ success: true, message: "Offer deleted and prices restored" });
  } catch (error) {
    console.error("Offer Delete Error:", error);
    res
      .status(500)
      .json({
        success: false,
        message: "Internal Server Error: " + error.message,
      });
  }
};

// THE FIX: Returns Products with active discounts for the Landing Page
exports.getHotDeals = async (req, res) => {
  try {
    const now = new Date();

    // 1. Fetch only ACTIVE offers within the valid date range
    const activeOffers = await Offer.find({
      status: "Active",
      startDate: { $lte: now },
      endDate: { $gte: now },
    });

    // 2. Fetch products and evaluate applicable offers
    const products = await Product.find().populate("category");

    const deals = products
      .map((product) => {
        // Find Product-specific or Category-wide offers
        const productOffer = activeOffers.find(
          (o) =>
            o.offerType === "Product" &&
            o.targetId.toString() === product._id.toString(),
        );
        const categoryOffer = activeOffers.find(
          (o) =>
            o.offerType === "Category" &&
            product.category &&
            o.targetId.toString() === product.category._id.toString(),
        );

        const appliedOffer = productOffer || categoryOffer;
        if (!appliedOffer) return null;

        // Calculate discounted price based on actualPrice
        const discount =
          (product.actualPrice * appliedOffer.discountPercentage) / 100;
        const offerPrice = Math.round(product.actualPrice - discount);

        return {
          _id: product._id,
          name: product.name,
          mainImage:
            product.mainImage ||
            (product.productImages && product.productImages[0]),
          originalPrice: product.actualPrice,
          offerPrice: offerPrice,
          discountPercentage: appliedOffer.discountPercentage,
          offerName: appliedOffer.name,
        };
      })
      .filter((deal) => deal !== null); // Only return products that have a deal

    res.status(200).json({ success: true, deals: deals.slice(0, 8) });
  } catch (error) {
    console.error("Hot Deals Error:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// Existing Category fetching logic
exports.getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true }).sort({
      createdAt: -1,
    });
    const formatted = await Promise.all(
      categories.map(async (cat) => {
        const productCount = await Product.countDocuments({
          category: cat._id,
        });
        return {
          id: cat._id.toString(),
          name: cat.name,
          desc: cat.description || "",
          img: cat.image
            ? `/uploads/categories/${path.basename(cat.image)}`
            : "/images/logo.jpg",
          products: productCount,
          isActive: cat.isActive,
        };
      }),
    );
    res.json({ success: true, data: formatted });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, error: "Failed to load categories" });
  }
};
