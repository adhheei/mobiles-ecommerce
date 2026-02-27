const Product = require("../../models/Product");
const Category = require("../../models/Category");
const path = require("path");

const getSuggestions = async (req, res) => {
    try {
        const { cartProductIds } = req.body;
        let excludeIds = cartProductIds || [];

        let cartBrands = [];
        let cartCategories = [];

        if (excludeIds.length > 0) {
            const cartItems = await Product.find({ _id: { $in: excludeIds } }).select("category brand");
            cartBrands = [...new Set(cartItems.map((p) => p.brand).filter((b) => b && b !== "Generic"))];
            cartCategories = cartItems.map((p) => p.category).filter(c => c);
        }

        const accessoryCategories = await Category.find({ name: { $regex: /accessor/i }, isActive: true }).select("_id");
        const accessoryCategoryIds = accessoryCategories.map((c) => c._id);

        const keywords = ["Case", "Cover", "Glass", "Screen Guard", "Charger", "Adapter", "Headset", "Cable"];
        const keywordRegex = keywords.map((k) => new RegExp(k, "i"));

        let query = { _id: { $nin: excludeIds }, status: "active", stock: { $gt: 0 } };
        let conditions = [];

        if (cartBrands.length > 0) {
            if (accessoryCategoryIds.length > 0) conditions.push({ brand: { $in: cartBrands }, category: { $in: accessoryCategoryIds } });
            conditions.push({ brand: { $in: cartBrands }, name: { $in: keywordRegex } });
        }
        if (accessoryCategoryIds.length > 0) conditions.push({ category: { $in: accessoryCategoryIds } });
        if (cartCategories.length > 0) conditions.push({ category: { $in: cartCategories } });

        if (conditions.length > 0) query.$or = conditions;

        let products = await Product.find(query).populate("category", "name").limit(8).sort({ createdAt: -1 });

        if (products.length < 3) {
            const more = await Product.find({ _id: { $nin: [...excludeIds, ...products.map(p => p._id)] }, status: "active", stock: { $gt: 0 } })
                .limit(6 - products.length).sort({ createdAt: -1 });
            products = [...products, ...more];
        }

        const formatted = products.slice(0, 6).map((p) => ({
            id: p._id.toString(),
            name: p.name,
            offerPrice: p.offerPrice,
            actualPrice: p.actualPrice,
            image: p.mainImage ? `/uploads/products/${path.basename(p.mainImage)}` : "/images/logo.jpg",
            category: p.category?.name,
        }));

        res.json({ success: true, products: formatted });
    } catch (err) {
        res.status(500).json({ success: false, error: "Failed" });
    }
};

module.exports = getSuggestions;