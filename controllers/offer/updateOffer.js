const Offer = require("../../models/Offer");
const { updateProductPrices } = require("./utils");

const updateOffer = async (req, res) => {
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
            { new: true }
        );

        if (!updatedOffer) {
            return res.status(404).json({ success: false, message: "Offer not found" });
        }

        // Recalculate prices if the offer is Active
        if (status === "Active") {
            await updateProductPrices(offerType, targetId, discountPercentage);
        }

        res.status(200).json({ success: true, message: "Offer updated successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = updateOffer;