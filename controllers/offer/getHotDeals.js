// controllers/offer/getHotDeals.js
const Offer = require("../../models/Offer");
const Product = require("../../models/Product");

const getHotDeals = async (req, res) => {
    try {
        const now = new Date();
        const activeOffers = await Offer.find({
            status: "Active",
            startDate: { $lte: now },
            endDate: { $gte: now },
        });

        const products = await Product.find().populate("category");

        const deals = products.map((product) => {
            const productOffer = activeOffers.find(
                (o) => o.offerType === "Product" && o.targetId.toString() === product._id.toString()
            );
            // ... (rest of your mapping logic remains the same)
            return deal;
        }).filter(Boolean);

        res.status(200).json({ success: true, deals: deals.slice(0, 8) });
    } catch (error) {
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

module.exports = getHotDeals;