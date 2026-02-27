const Cart = require("../../models/Cart");
const { formatCart } = require("../../utils/cartHelpers");

/**
 * @desc    Get user cart with calculated totals
 * @route   GET /api/cart
 * @access  Private
 */
const getCart = async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Populate product details to calculate prices and check stock
        let cart = await Cart.findOne({ userId }).populate("items.productId");

        // If no cart exists yet, return an empty cart structure
        if (!cart) {
            return res.status(200).json({
                cart: {
                    items: [],
                    subtotal: 0,
                    totalMrp: 0,
                    discount: 0,
                    totalAmount: 0,
                },
            });
        }

        // Clean up: Remove any items where the product might have been deleted from the DB
        cart.items = cart.items.filter((item) => item.productId);

        // Use the helper to format the response (calculates subtotal, discounts, etc.)
        const formattedCart = formatCart(cart);

        res.status(200).json(formattedCart);
    } catch (error) {
        console.error("Get Cart Error:", error);
        res.status(500).json({ message: "Server error while fetching cart" });
    }
};

module.exports = getCart;