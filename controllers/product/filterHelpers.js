const Product = require("../../models/Product");
const Category = require("../../models/Category");

// ✅ Get categories for Admin dropdowns
const getCategoriesForDropdown = async (req, res) => {
    try {
        const categories = await Category.find({ isActive: true }, "name");
        res.json({ success: true, categories });
    } catch (err) {
        res.status(500).json({ success: false, error: "Failed to load dropdown" });
    }
};

// ✅ Get categories with live product counts for Sidebar
const getCategoriesWithCounts = async (req, res) => {
    try {
        const categories = await Category.find({ isActive: true });
        const categoriesWithCounts = await Promise.all(
            categories.map(async (cat) => {
                const productCount = await Product.countDocuments({
                    category: cat._id,
                    stock: { $gt: 0 },
                    isDeleted: false
                });
                return {
                    _id: cat._id.toString(),
                    name: cat.name,
                    productCount: productCount,
                };
            })
        );
        res.json({ success: true, categories: categoriesWithCounts });
    } catch (err) {
        res.status(500).json({ success: false, error: "Failed to load sidebar counts" });
    }
};

// ✅ Get unique brand list for Filtering
const getUniqueBrands = async (req, res) => {
    try {
        const brands = await Product.distinct("brand", { isDeleted: false });
        res.status(200).json({
            success: true,
            brands: brands.filter((b) => b),
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    getCategoriesForDropdown,
    getCategoriesWithCounts,
    getUniqueBrands
};