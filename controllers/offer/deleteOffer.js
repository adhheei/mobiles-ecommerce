const Offer = require("../../models/Offer");
const Product = require("../../models/Product");

/**
 * @desc    Delete an offer and reset associated product prices
 * @route   DELETE /api/admin/offers/:id
 * @access  Private/Admin
 */
const deleteOffer = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Find the offer first to identify which products/categories are affected
    const offer = await Offer.findById(id);
    if (!offer) {
      return res
        .status(404)
        .json({ success: false, message: "Offer not found" });
    }

    // 2. Reset product prices before deleting the offer
    // This prevents products from being "stuck" with a discounted price after the offer is gone
    if (offer.offerType === "Product") {
      await Product.updateMany(
        { _id: offer.targetId }, // targetId is the specific product
        { $unset: { offerPrice: "" } }, // Removes the offerPrice field entirely
      );
    } else if (offer.offerType === "Category") {
      await Product.updateMany(
        { category: offer.targetId }, // targetId is the category ID
        { $unset: { offerPrice: "" } },
      );
    }

    // 3. Delete the offer document
    await Offer.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Offer deleted and product prices restored successfully",
    });
  } catch (error) {
    console.error("Offer Delete Error:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error: " + error.message,
    });
  }
};

module.exports = deleteOffer;
