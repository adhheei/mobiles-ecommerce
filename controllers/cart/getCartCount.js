const Cart = require("../../models/Cart");

/**
 * @desc    Get total number of items in cart
 * @route   GET /api/cart/count
 * @access  Private
 */
const getCartCount = async (req, res) => {
    try {
        const userId = req.user ? req.user.id : null;
        if (!userId) {
            return res.status(200).json({ success: true, count: 0 });
        }
        const cart = await Cart.findOne({ userId });

        // Sum up all quantities in the items array
        const count = cart
            ? cart.items.reduce((acc, item) => acc + (item.quantity || 0), 0)
            : 0;

        res.status(200).json({ success: true, count });
    } catch (error) {
        // Return 0 instead of a 500 error so the UI doesn't break
        res.status(200).json({ success: true, count: 0 });
    }
};

module.exports = getCartCount;