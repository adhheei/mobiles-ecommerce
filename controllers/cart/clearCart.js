const Cart = require("../../models/Cart");

/**
 * @desc    Remove all items from user cart
 * @route   DELETE /api/cart/clear
 * @access  Private
 */
const clearCart = async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Find the user's cart and set the items array to empty
        await Cart.findOneAndUpdate({ userId }, { items: [] });
        
        res.status(200).json({ success: true, message: "Cart cleared successfully" });
    } catch (error) {
        console.error("Clear Cart Error:", error);
        res.status(500).json({ message: "Server error while clearing cart" });
    }
};

module.exports = clearCart;