const Offer = require("../../models/Offer");

/**
 * @desc    Get all active offers with populated targets
 * @route   GET /api/admin/offers
 * @access  Private/Admin
 */
const getAllOffers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = {}; // Admin sees all offers (Active and Inactive)
    const total = await Offer.countDocuments(query);
    const offers = await Offer.find(query)
      .populate("targetId")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      offers,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit,
      },
    });
  } catch (error) {
    console.error("Get All Offers Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = getAllOffers;
