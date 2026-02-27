// controllers/cart/addToCart.js
const Cart = require("../../models/Cart");
const Product = require("../../models/Product");

const addToCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId, quantity } = req.body;
    const qty = parseInt(quantity) || 1;

    let cart = await Cart.findOne({ userId }) || new Cart({ userId, items: [] });
    const product = await Product.findById(productId);

    if (!product) return res.status(404).json({ message: "Product not found" });

    const itemIndex = cart.items.findIndex(p => p.productId.toString() === productId);
    let newQuantity = itemIndex > -1 ? cart.items[itemIndex].quantity + qty : qty;

    if (product.stock < newQuantity) {
      return res.status(400).json({ message: `Insufficient stock. Only ${product.stock} units available.` });
    }

    if (itemIndex > -1) cart.items[itemIndex].quantity = newQuantity;
    else cart.items.push({ productId, quantity: qty });

    await cart.save();
    res.status(200).json({ message: "Product added to cart" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = addToCart;