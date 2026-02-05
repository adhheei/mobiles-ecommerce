const Offer = require("../models/Offer");
const Product = require("../models/Product");
const Category = require("../models/Category");

// GET all offers for the admin table
exports.getAllOffers = async (req, res) => {
  try {
    const offers = await Offer.find()
      .populate("targetId") // This will show Product/Category names
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, offers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

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

    // Recalculate prices
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
    const offer = await Offer.findByIdAndDelete(req.params.id);
    if (!offer)
      return res
        .status(404)
        .json({ success: false, message: "Offer not found" });

    // Optional: Reset product prices to actualPrice here if needed

    res
      .status(200)
      .json({ success: true, message: "Offer deleted successfully" });
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

exports.getAllCategories = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";
    const skip = (page - 1) * limit;

    let query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const total = await Category.countDocuments(query);
    const categories = await Category.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // For each category, count related products
    const formatted = await Promise.all(
      categories.map(async (cat) => {
        // Count products where `category` = cat._id
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
          products: productCount, // ✅ REAL COUNT
          isActive: cat.isActive,
        };
      }),
    );

    res.json({
      success: true,
      data: formatted,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("Error in getAllCategories:", err);
    res
      .status(500)
      .json({ success: false, error: "Failed to load categories" });
  }
};

exports.getOfferById = async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id);
    if (!offer) {
      return res
        .status(404)
        .json({ success: false, message: "Offer not found" });
    }
    res.status(200).json({ success: true, offer });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
