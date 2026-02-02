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

        // Helper to format image path
        const formatImageUrl = (filePath) => {
            if (!filePath) return "";
            return "/" + filePath.replace(/\\/g, "/").replace(/^public\//, "").replace(/^\//, "");
        };

        if (product.mainImage) {
            image = formatImageUrl(product.mainImage);
        } else if (product.productImages && product.productImages.length > 0) {
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

// Email Transporter (Reuse credentials)
const nodemailer = require("nodemailer");
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

// Helper to format image path
const formatImageUrl = (filePath) => {
    if (!filePath) return "https://placehold.co/100x120/f0f0f0/333?text=No+Image";
    return "/" + filePath.replace(/\\/g, "/").replace(/^public\//, "").replace(/^\//, "");
};

// Place Order & Handle Wallet & Coupon
const placeOrder = async (req, res) => {
    try {
        console.log("👉 Place Order Called");
        console.log("User:", req.user ? req.user.id : "Unauth");
        console.log("Body:", JSON.stringify(req.body, null, 2));

        const userId = req.user.id;
        const { paymentMethod, useWallet, addressId, buyNowItem, couponCode } = req.body;

        let orderItems = [];
        let subtotal = 0;

        // --- 1. IDENTIFY ITEMS (Cart vs BuyNow) ---
        if (buyNowItem && buyNowItem.productId) {
            // Buy Now Flow
            console.log("✅ Processing BuyNow Item:", buyNowItem);
            const product = await Product.findById(buyNowItem.productId || buyNowItem._id);

            if (!product) {
                return res.status(404).json({ message: "Product not found" });
            }

            const price = product.offerPrice || product.price || 0;
            const qty = parseInt(buyNowItem.qty) || parseInt(buyNowItem.quantity) || 1;

            subtotal = price * qty;
            orderItems = [{
                productId: product._id,
                name: product.productName || product.name,
                image: formatImageUrl(product.mainImage || (product.productImages && product.productImages[0])),
                price: price,
                quantity: qty,
                lineTotal: subtotal
            }];
        } else {
            // Cart Flow
            console.log("🛒 Processing Cart Flow");
            const cart = await Cart.findOne({ userId }).populate("items.productId");

            if (!cart || cart.items.length === 0) {
                return res.status(400).json({ message: "Cart is empty" });
            }

            cart.items.forEach(item => {
                const product = item.productId;
                if (product) {
                    const price = product.offerPrice || product.price || 0;
                    const lineTotal = price * item.quantity;
                    subtotal += lineTotal;

                    orderItems.push({
                        productId: product._id,
                        name: product.productName || product.name,
                        image: formatImageUrl(product.mainImage || (product.productImages && product.productImages[0])),
                        price: price,
                        quantity: item.quantity,
                        lineTotal: lineTotal
                    });
                }
            });
        }

        // --- 2. APPLY COUPON ---
        let couponDiscount = 0;
        let appliedCouponCode = null;
        let couponIdToUpdate = null;

        if (couponCode) {
            const Coupon = require("../models/Coupon");
            const coupon = await Coupon.findOne({ code: couponCode.toUpperCase() });

            // Validate Coupon (Strict Re-check)
            if (coupon && coupon.isActive) {
                const now = new Date();
                const start = new Date(coupon.startDate);
                const end = new Date(coupon.endDate);

                // Usability Checks
                const userUsage = (coupon.userUsage && coupon.userUsage.get(userId.toString())) || 0;
                const isLimitReached = (coupon.perUserLimit !== null && userUsage >= coupon.perUserLimit);
                const isExpired = now < start || now > end;
                const isMinPurchase = subtotal >= coupon.minPurchase;

                if (!isLimitReached && !isExpired && isMinPurchase) {
                    // Valid! Calculate
                    if (coupon.discountType === 'fixed') {
                        couponDiscount = coupon.value;
                    } else if (coupon.discountType === 'percentage') {
                        couponDiscount = (subtotal * coupon.value) / 100;
                        if (coupon.maxDiscount !== null) {
                            couponDiscount = Math.min(couponDiscount, coupon.maxDiscount);
                        }
                    }

                    // Cap discount at subtotal
                    couponDiscount = Math.min(couponDiscount, subtotal);

                    appliedCouponCode = coupon.code;
                    couponIdToUpdate = coupon._id;
                    console.log(`✅ Coupon ${coupon.code} applied. Discount: ${couponDiscount}`);
                } else {
                    console.warn(`⚠️ Coupon ${couponCode} invalid at checkout: Expired/Limit/MinPurchase`);
                }
            } else {
                console.warn(`⚠️ Coupon ${couponCode} not found or inactive`);
            }
        }

        // --- 3. WALLET & PAYMENTS ---
        let totalAfterCoupon = subtotal - couponDiscount;
        let totalAmount = totalAfterCoupon;

        let walletDeducted = 0;
        const Wallet = require("../models/Wallet");
        const Transaction = require("../models/Transaction");

        if (useWallet) {
            const wallet = await Wallet.findOne({ userId });
            if (wallet && wallet.balance > 0) {
                const deduction = Math.min(wallet.balance, totalAmount);
                wallet.balance -= deduction;
                wallet.transactions.push({
                    userId,
                    amount: deduction,
                    type: "DEBIT",
                    reason: "ORDER_PAYMENT",
                    orderId: "PENDING"
                });
                await wallet.save();
                walletDeducted = deduction;
                totalAmount -= deduction;
            }
        }

        // --- 4. CREATE TRANSACTION ---
        const orderId = "ORD-" + Date.now();
        const txnId = "TXN-" + Date.now();
        const pMethod = walletDeducted > 0 ? (totalAmount === 0 ? "Wallet" : `Wallet + ${paymentMethod}`) : paymentMethod;

        const userName = (req.user.firstName && req.user.lastName)
            ? `${req.user.firstName} ${req.user.lastName}`
            : (req.user.name || "User");

        await Transaction.create({
            transactionId: txnId,
            orderId: orderId,
            user: { name: userName, email: req.user.email },
            paymentMethod: pMethod,
            amount: totalAfterCoupon, // Store amount AFTER coupon, before wallet splits
            status: "Success"
        });

        // --- 5. UPDATE COUPON USAGE ---
        if (couponIdToUpdate) {
            const Coupon = require("../models/Coupon");
            // Map keys must be strings
            const updateKey = `userUsage.${userId}`;
            await Coupon.findByIdAndUpdate(couponIdToUpdate, {
                $inc: { [updateKey]: 1 } // Increment specific user usage
            });
        }

        // --- 6. CLEAR CART ---
        if (!buyNowItem) {
            await Cart.findOneAndUpdate({ userId }, { $set: { items: [] } });
        }

        // --- 7. SEND EMAIL ---
        try {
            const itemsHtml = orderItems.map(item => `
                <tr>
                    <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.name}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.quantity}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #eee;">Rs. ${item.price}</td>
                </tr>
            `).join('');

            const emailHtml = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #1a1a1a;">Thank you for your order!</h2>
                    <p>Hi ${userName},</p>
                    <p>Your order <strong>${orderId}</strong> has been placed successfully.</p>
                    
                    <h3 style="border-bottom: 1px solid #ccc; padding-bottom: 10px;">Order Summary</h3>
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="background: #f8f9fa;">
                                <th style="padding: 10px; text-align: left;">Product</th>
                                <th style="padding: 10px; text-align: left;">Qty</th>
                                <th style="padding: 10px; text-align: left;">Price</th>
                            </tr>
                        </thead>
                        <tbody>${itemsHtml}</tbody>
                    </table>

                    <div style="margin-top: 20px; text-align: right;">
                        <p>Subtotal: Rs. ${subtotal}</p>
                        ${couponDiscount > 0 ? `<p style="color: green;">Coupon (${appliedCouponCode}): - Rs. ${couponDiscount}</p>` : ''}
                        ${walletDeducted > 0 ? `<p style="color: green;">Wallet: - Rs. ${walletDeducted}</p>` : ''}
                        <h3 style="color: #d32f2f;">Total Paid: Rs. ${totalAmount}</h3>
                    </div>

                    <p style="margin-top: 30px; font-size: 12px; color: #777;">
                        Shipping to selected address.<br>Jinsa Mobiles Team
                    </p>
                </div>
            `;

            await transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: req.user.email,
                subject: `Order Confirmation - ${orderId}`,
                html: emailHtml
            });
            console.log("✅ Email sent to " + req.user.email);
        } catch (emailErr) {
            console.error("⚠️ Email failed:", emailErr);
            // Don't fail the order just because email failed
        }

        res.status(200).json({
            success: true,
            message: "Order placed successfully",
            orderId: orderId,
            orderItems: orderItems,
            totals: {
                subtotal,
                couponDiscount,
                walletDeducted,
                totalAmount: totalAmount // This is valid payable amount
            },
            appliedCoupon: appliedCouponCode
        });

    } catch (error) {
        console.error("❌ Place Order Critical Error:", error);
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
};

module.exports = {
    getCart,
    addToCart,
    updateCart,
    removeFromCart,
    clearCart,
    getCartCount,
    placeOrder
};
