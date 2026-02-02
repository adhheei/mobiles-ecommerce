const Cart = require("../models/Cart");
const Product = require("../models/Product");

// Get user cart
const getCart = async (req, res) => {
    try {
        const userId = req.user.id;
        let cart = await Cart.findOne({ userId }).populate("items.productId");

        if (!cart) {
            return res.status(200).json({ cart: { items: [], subtotal: 0, totalMrp: 0, discount: 0, totalAmount: 0 } });
        }

        // Filter out null products (if product deleted)
        cart.items = cart.items.filter(item => item.productId);

        const formattedCart = formatCart(cart);
        res.status(200).json(formattedCart);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

// Add item to cart
const addToCart = async (req, res) => {
    try {
        const userId = req.user.id;
        const { productId, quantity } = req.body;
        const qty = parseInt(quantity) || 1;

        let cart = await Cart.findOne({ userId });
        if (!cart) {
            cart = new Cart({ userId, items: [] });
        }

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        const itemIndex = cart.items.findIndex(p => p.productId.toString() === productId);
        if (itemIndex > -1) {
            cart.items[itemIndex].quantity += qty;
        } else {
            cart.items.push({ productId, quantity: qty });
        }

        await cart.save();

        // Return full cart or success message
        // Ideally return formatted cart so frontend can update count/view immediately if needed
        // But for "Add to Cart" button usually just 200 OK is enough
        res.status(200).json({ message: "Product added to cart" });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

// Update item quantity
const updateCart = async (req, res) => {
    try {
        const userId = req.user.id;
        const { productId, quantity } = req.body;
        const qty = parseInt(quantity);

        if (qty < 1) {
            return res.status(400).json({ message: "Quantity must be at least 1" });
        }

        const cart = await Cart.findOne({ userId });
        if (!cart) return res.status(404).json({ message: "Cart not found" });

        const itemIndex = cart.items.findIndex(p => p.productId.toString() === productId);
        if (itemIndex > -1) {
            cart.items[itemIndex].quantity = qty;
            await cart.save();

            // Re-fetch to populate for response
            const updatedCart = await Cart.findOne({ userId }).populate("items.productId");
            res.status(200).json({ cart: formatCart(updatedCart) });
        } else {
            res.status(404).json({ message: "Item not found in cart" });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

// Remove item
const removeFromCart = async (req, res) => {
    try {
        const userId = req.user.id;
        const { productId } = req.params;

        const cart = await Cart.findOne({ userId });
        if (!cart) return res.status(404).json({ message: "Cart not found" });

        cart.items = cart.items.filter(p => p.productId.toString() !== productId);
        await cart.save();

        const updatedCart = await Cart.findOne({ userId }).populate("items.productId");
        res.status(200).json({ cart: formatCart(updatedCart) });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

// Clear cart
const clearCart = async (req, res) => {
    try {
        const userId = req.user.id;
        const cart = await Cart.findOne({ userId });
        if (cart) {
            cart.items = [];
            await cart.save();
        }
        res.status(200).json({ message: "Cart cleared", cart: { items: [], subtotal: 0, totalMrp: 0, discount: 0, totalAmount: 0 } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

// Helper: Format Cart for Frontend
function formatCart(cart) {
    let subtotal = 0;
    let totalMrp = 0;

    const items = cart.items.map(item => {
        const product = item.productId; // Populated
        // Handle product deletion/null case
        if (!product) return null;

        const price = product.offerPrice || product.price || 0;
        const mrp = product.actualPrice || product.price || 0; // Default MRP to price if not set
        const lineTotal = price * item.quantity;

        subtotal += lineTotal;
        totalMrp += mrp * item.quantity;

        // Image Handling
        let image = "https://placehold.co/100x120/f0f0f0/333?text=No+Image";
        if (product.productImages && product.productImages.length > 0) {
            // Assuming paths are stored relative or absolute. 
            // If array of strings:
            image = product.productImages[0];
        }

        return {
            productId: product._id,
            name: product.productName || product.name,
            image: image,
            color: product.color,
            price: price,
            mrp: mrp,
            quantity: item.quantity,
            lineTotal: lineTotal
        };
    }).filter(i => i !== null);

    const discount = totalMrp - subtotal;
    const totalAmount = subtotal; // + Shipping if any

    return {
        items,
        subtotal,
        totalMrp,
        discount,
        totalAmount
    };
}


// Get cart count
const getCartCount = async (req, res) => {
    try {
        const userId = req.user.id;
        const cart = await Cart.findOne({ userId });

        if (!cart || !cart.items) {
            return res.status(200).json({ count: 0 });
        }

        // Sum up quantities
        const count = cart.items.reduce((acc, item) => acc + (item.quantity || 0), 0);

        res.status(200).json({ count });
    } catch (error) {
        console.error("Get cart count error:", error);
        res.status(200).json({ count: 0 }); // Fallback to 0 on error
    }
};

module.exports = {
    getCart,
    addToCart,
    updateCart,
    removeFromCart,
    clearCart,
    getCartCount
};
