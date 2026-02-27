// 3. GET SINGLE ADDRESS
const Address = require("../../models/Address");

const getAddress = async (req, res) => {
    try {
        const address = await Address.findOne({
            _id: req.params.id,
            user: req.user._id,
        });

        if (!address) {
            return res.status(404).json({ message: "Address not found" });
        }

        res.status(200).json({ success: true, address });
    } catch (error) {
        console.error("Get Address Error:", error);
        res.status(500).json({ message: "Server error fetching address" });
    }
};

module.exports = getAddress;