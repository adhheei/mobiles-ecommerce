const Product = require("../../models/Product");
const Category = require("../../models/Category");
const path = require("path");

exports.getCategoriesWithCounts = async (req, res) => {
    try {
        const categories = await Category.find({ isActive: true });
        const categoriesWithCounts = await Promise.all(
            categories.map(async (cat) => {
                const productCount = await Product.countDocuments({
                    category: cat._id, stock: { $gt: 0 }, status: "active",
                });
                return { _id: cat._id.toString(), name: cat.name, productCount };
            })
        );
        res.json({ success: true, categories: categoriesWithCounts });
    } catch (err) {
        res.status(500).json({ success: false, error: "Failed to load categories" });
    }
};

exports.getAllCategories = async (req, res) => {
    try {
        const categories = await Category.find({ isActive: true }).sort({ createdAt: -1 });
        const formatted = categories.map((cat) => ({
            _id: cat._id.toString(),
            id: cat._id.toString(),
            name: cat.name,
            image: cat.image ? `/uploads/categories/${path.basename(cat.image)}` : "/images/logo.jpg",
        }));
        res.json({ success: true, data: formatted });
    } catch (err) {
        res.status(500).json({ success: false, error: "Failed to load categories" });
    }
};