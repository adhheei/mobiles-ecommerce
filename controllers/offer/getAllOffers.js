const Offer = require("../../models/Offer");

/**
 * @desc    Get all active offers with populated targets
 * @route   GET /api/admin/offers
 * @access  Private/Admin
 */
const getAllOffers = async (req, res) => {
  try {
    const offers = await Offer.find({ status: "Active" })
      .populate("targetId")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      offers,
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
