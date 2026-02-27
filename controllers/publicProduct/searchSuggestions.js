const Product = require("../../models/Product");
const Category = require("../../models/Category");
const path = require("path");

/**
 * @desc    Live search suggestions for products and categories
 * @route   GET /api/products/search/suggestions
 * @access  Public
 */
const getSearchSuggestions = async (req, res) => {
    try {
        const { q } = req.query;
        if (!q || q.length < 1) {
            return res.json({ success: true, suggestions: [] });
        }

        const regex = new RegExp(q, "i");

        // 1. Search Active Products
        const products = await Product.find({
            $or: [{ name: regex }, { description: regex }],
            status: { $in: ["active", "outofstock"] },
        })
            .select("name _id mainImage category brand")
            .populate("category", "name")
            .limit(5);

        // 2. Search Active Categories
        const categories = await Category.find({
            name: regex,
        })
            .select("name _id")
            .limit(3);

        const suggestions = [];

        // Format Category suggestions
        categories.forEach((cat) => {
            suggestions.push({
                type: "category",
                label: cat.name,
                id: cat._id,
                url: `./productPage.html?category=${cat._id}`,
            });
        });

        // Format Product suggestions
        products.forEach((prod) => {
            suggestions.push({
                type: "product",
                label: prod.name,
                image: prod.mainImage
                    ? `/uploads/products/${path.basename(prod.mainImage)}`
                    : "/images/logo.jpg",
                id: prod._id,
                url: `./singleProductPage.html?id=${prod._id}`,
            });
        });

        res.json({ success: true, suggestions });
    } catch (err) {
        console.error("Error in getSearchSuggestions:", err);
        res.status(500).json({ success: false, error: "Search failed" });
    }
};

module.exports = getSearchSuggestions;