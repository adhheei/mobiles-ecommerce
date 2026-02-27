const Cart = require("../../models/Cart");
const { formatCart } = require("../../utils/cartHelpers");

/**
 * @desc    Remove a specific product from the cart
 * @route   DELETE /api/cart/:productId
 * @access  Private
 */
const removeFromCart = async (req, res) => {
    try {
        const userId = req.user.id;
        const { productId } = req.params;

        const cart = await Cart.findOne({ userId });

        if (!cart) {
            return res.status(404).json({ message: "Cart not found" });
        }

        // Filter out the item to be removed
        cart.items = cart.items.filter(
            (item) => item.productId.toString() !== productId
        );

        await cart.save();

        // Re-fetch with population to get the latest product prices for the helper
        const updatedCart = await Cart.findOne({ userId }).populate(
            "items.productId"
        );

        // Return the formatted cart so the frontend UI updates totals immediately
        res.status(200).json({ 
            success: true, 
            cart: formatCart(updatedCart) 
        });
    } catch (error) {
        console.error("Remove From Cart Error:", error);
        res.status(500).json({ message: "Server error while removing item" });
    }
};

module.exports = removeFromCart;