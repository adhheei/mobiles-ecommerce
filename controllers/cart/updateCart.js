const Cart = require("../../models/Cart");
const Product = require("../../models/Product");
const { formatCart } = require("../../utils/cartHelpers");

/**
 * @desc    Update quantity of a product in the cart
 * @route   PUT /api/cart/update
 * @access  Private
 */
const updateCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId, quantity } = req.body;
    const qty = parseInt(quantity);

    // 1. Basic validation
    if (qty < 1) {
      return res.status(400).json({ message: "Quantity must be at least 1" });
    }

    const cart = await Cart.findOne({ userId });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    // 2. Locate the item in the cart
    const itemIndex = cart.items.findIndex(
      (p) => p.productId.toString() === productId,
    );

    if (itemIndex > -1) {
      // 3. Stock Validation
      const product = await Product.findById(productId);
      if (!product)
        return res.status(404).json({ message: "Product no longer exists" });

      if (product.stock < qty) {
        return res.status(400).json({
          message: `Only ${product.stock} units available in stock.`,
        });
      }

      // 4. Update and Save
      cart.items[itemIndex].quantity = qty;
      await cart.save();

      // 5. Return updated cart with fresh totals
      const updatedCart = await Cart.findOne({ userId }).populate(
        "items.productId",
      );
      res.status(200).json({
        success: true,
        cart: formatCart(updatedCart),
      });
    } else {
      res.status(404).json({ message: "Item not found in cart" });
    }
  } catch (error) {
    console.error("Update Cart Error:", error);
    res.status(500).json({ message: "Server error while updating cart" });
  }
};

module.exports = updateCart;
