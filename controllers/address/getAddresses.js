// 2. GET ALL ADDRESSES
const Address = require("../../models/Address");


const getAddresses = async (req, res) => {
    try {
        // Sort by default first, then newest
        const addresses = await Address.find({ user: req.user._id }).sort({
            isDefault: -1,
            createdAt: -1,
        });
        res.status(200).json({ success: true, addresses });
    } catch (error) {
        console.error("Get Addresses Error:", error);
        res.status(500).json({ message: "Server error fetching addresses" });
    }
};

module.exports = getAddresses;