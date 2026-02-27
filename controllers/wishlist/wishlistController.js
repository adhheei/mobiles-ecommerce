const User = require("../../models/User");
const Product = require("../../models/Product");

const getWishlist = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).populate("wishlist");
        res.status(200).json({ success: true, wishlist: user.wishlist });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

const addToWishlist = async (req, res) => {
    try {
        const { productId } = req.body;
        const product = await Product.findById(productId);
        
        if (!product || product.stock <= 0) {
            return res.status(400).json({ success: false, message: "Product unavailable" });
        }

        const user = await User.findById(req.user._id);
        user.wishlist.addToSet(productId);
        await user.save();

        res.status(200).json({ success: true, message: "Added to wishlist" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const removeFromWishlist = async (req, res) => {
    try {
        const { productId } = req.params;
        const user = await User.findById(req.user._id);
        
        user.wishlist = user.wishlist.filter(id => id && id.toString() !== productId);
        await user.save();

        res.status(200).json({ success: true, message: "Removed from wishlist" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { getWishlist, addToWishlist, removeFromWishlist };