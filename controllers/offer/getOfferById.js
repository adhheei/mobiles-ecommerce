const Offer = require("../../models/Offer");

const getOfferById = async (req, res) => {
    try {
        const offer = await Offer.findById(req.params.id);
        
        if (!offer) {
            return res.status(404).json({ success: false, message: "Offer not found" });
        }
        
        // Wrapped in 'data' for consistent frontend consumption
        res.status(200).json({ success: true, data: offer });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = getOfferById;