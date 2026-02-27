// 6. SET DEFAULT ADDRESS
const Address = require("../../models/Address");

const setDefaultAddress = async (req, res) => {
    try {
        const address = await Address.findOne({
            _id: req.params.id,
            user: req.user._id,
        });

        if (!address) {
            return res.status(404).json({ message: "Address not found" });
        }

        // Unset current default
        await Address.updateMany(
            { user: req.user._id, isDefault: true },
            { isDefault: false }
        );

        // Set new default
        address.isDefault = true;
        await address.save();

        res.status(200).json({ success: true, message: "Default address updated" });
    } catch (error) {
        console.error("Set Default Address Error:", error);
        res.status(500).json({ message: "Server error setting default address" });
    }
};

module.exports = setDefaultAddress;
