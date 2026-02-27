// 5. DELETE ADDRESS
const Address = require("../../models/Address");

const deleteAddress = async (req, res) => {
    try {
        const address = await Address.findOne({
            _id: req.params.id,
            user: req.user._id,
        });

        if (!address) {
            return res.status(404).json({ message: "Address not found" });
        }

        await address.deleteOne();

        res.status(200).json({ success: true, message: "Address deleted successfully" });
    } catch (error) {
        console.error("Delete Address Error:", error);
        res.status(500).json({ message: "Server error deleting address" });
    }
};

module.exports = deleteAddress;