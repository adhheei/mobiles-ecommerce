const Offer = require("../../models/Offer");
const { updateProductPrices, resetProductPrices } = require("./utils");

const updateOffer = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            name,
            slogan,
            discountValue,
            discountType,
            offerType,
            targetId,
            startDate,
            endDate,
            status,
        } = req.body;

        const oldOffer = await Offer.findById(id);
        if (!oldOffer) {
            return res.status(404).json({ success: false, message: "Offer not found" });
        }

        // Reset the old target's prices back to actualPrice first
        await resetProductPrices(oldOffer.offerType, oldOffer.targetId);

        const updatedOffer = await Offer.findByIdAndUpdate(
            id,
            {
                name,
                slogan,
                discountValue,
                discountType,
                offerType,
                targetId,
                startDate,
                endDate,
                status,
            },
            { new: true }
        );

        // Apply new prices if the updated offer is Active
        if (status === "Active") {
            await updateProductPrices(offerType, targetId, discountValue, discountType);
        }

        res.status(200).json({ success: true, message: "Offer updated successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = updateOffer;