// controllers/offer/addOffer.js
const Offer = require("../../models/Offer");
const { updateProductPrices } = require("./utils");

const addOffer = async (req, res) => {
    try {
        const { name, discountPercentage, offerType, targetId, startDate, endDate } = req.body;
        
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

        res.status(201).json({ success: true, message: "Offer created successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = addOffer;