const Address = require("../models/Address");

// 1. ADD NEW ADDRESS
exports.addAddress = async (req, res) => {
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

        if (
            !fullName ||
            !phone ||
            !street ||
            !city ||
            !state ||
            !pincode ||
            !country ||
            !addressType
        ) {
            return res.status(400).json({ message: "All fields are required" });
        }

        // If setting as default, unset other defaults
        if (isDefault) {
            await Address.updateMany(
                { user: req.user._id, isDefault: true },
                { isDefault: false }
            );
        }

        // If first address, make it default automatically
        const count = await Address.countDocuments({ user: req.user._id });
        const finalIsDefault = count === 0 ? true : isDefault || false;

        const address = await Address.create({
            user: req.user._id,
            fullName,
            phone,
            street,
            city,
            state,
            pincode,
            country,
            addressType,
            isDefault: finalIsDefault,
        });

        res.status(201).json({ success: true, address });
    } catch (error) {
        console.error("Add Address Error:", error);
        res.status(500).json({ message: "Server error while adding address" });
    }
};

// 2. GET ALL ADDRESSES
exports.getAddresses = async (req, res) => {
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

// 3. GET SINGLE ADDRESS
exports.getAddress = async (req, res) => {
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

// 4. UPDATE ADDRESS
exports.updateAddress = async (req, res) => {
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

// 5. DELETE ADDRESS
exports.deleteAddress = async (req, res) => {
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

// 6. SET DEFAULT ADDRESS
exports.setDefaultAddress = async (req, res) => {
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
