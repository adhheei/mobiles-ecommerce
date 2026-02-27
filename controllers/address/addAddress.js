// controllers/address/addAddress.js
const Address = require("../../models/Address");

const addAddress = async (req, res) => {
    try {
        const { fullName, phone, street, city, state, pincode, country, addressType, isDefault } = req.body;

        if (!fullName || !phone || !street || !city || !state || !pincode || !country || !addressType) {
            return res.status(400).json({ message: "All fields are required" });
        }

        if (isDefault) {
            await Address.updateMany({ user: req.user._id, isDefault: true }, { isDefault: false });
        }

        const count = await Address.countDocuments({ user: req.user._id });
        const finalIsDefault = count === 0 ? true : isDefault || false;

        const address = await Address.create({
            user: req.user._id,
            fullName, phone, street, city, state, pincode, country, addressType,
            isDefault: finalIsDefault,
        });

        res.status(201).json({ success: true, address });
    } catch (error) {
        console.error("Add Address Error:", error);
        res.status(500).json({ message: "Server error while adding address" });
    }
};

module.exports = addAddress;