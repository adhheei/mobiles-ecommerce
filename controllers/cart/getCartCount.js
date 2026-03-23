const Cart = require("../../models/Cart");

/**
 * @desc    Get total number of items in cart
 * @route   GET /api/cart/count
 * @access  Private
 */
const getCartCount = async (req, res) => {
    try {
        const userId = req.user ? req.user.id : null;
        console.log('[CartCountDebug] req.user:', req.user ? 'PRESENT' : 'MISSING', 'userId:', userId);
        
        if (!userId) {
            return res.status(200).json({ success: true, count: 0 });
        }
        const cart = await Cart.findOne({ userId });
        console.log('[CartCountDebug] Cart found:', cart ? 'YES' : 'NO', 'Items:', cart ? cart.items.length : 0);

        // Sum up all quantities in the items array
        const count = cart
            ? cart.items.reduce((acc, item) => acc + (item.quantity || 0), 0)
            : 0;
            
        console.log('[CartCountDebug] Final count:', count);

        res.status(200).json({ success: true, count });
    } catch (error) {
        console.error("[CartCountDebug] Error:", error);
        // Return 0 instead of a 500 error so the UI doesn't break
        res.status(200).json({ success: true, count: 0 });
    }
};

module.exports = getCartCount;