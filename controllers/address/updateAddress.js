// 4. UPDATE ADDRESS
const Address = require("../../models/Address");

const updateAddress = async (req, res) => {
    try {
        const {
            fullName,
            phone,
            street,
            city,
            state,
            pincode,
            country,
            addressType,
            isDefault,
        } = req.body;

        const address = await Address.findOne({
            _id: req.params.id,
            user: req.user._id,
        });

        if (!address) {
            return res.status(404).json({ message: "Address not found" });
        }

        // If making default, unset others first
        if (isDefault && !address.isDefault) {
            await Address.updateMany(
                { user: req.user._id, isDefault: true },
                { isDefault: false }
            );
        }

        address.fullName = fullName || address.fullName;
        address.phone = phone || address.phone;
        address.street = street || address.street;
        address.city = city || address.city;
        address.state = state || address.state;
        address.pincode = pincode || address.pincode;
        address.country = country || address.country;
        address.addressType = addressType || address.addressType;
        if (typeof isDefault !== "undefined") address.isDefault = isDefault;

        await address.save();

        res.status(200).json({ success: true, address });
    } catch (error) {
        console.error("Update Address Error:", error);
        res.status(500).json({ message: "Server error updating address" });
    }
};

module.exports = updateAddress;