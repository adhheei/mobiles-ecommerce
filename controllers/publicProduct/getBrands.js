const Product = require("../../models/Product");

/**
 * @desc    Get unique brands with product counts for filter sidebar
 * @route   GET /api/products/brands
 * @access  Public
 */
const getBrandsWithCounts = async (req, res) => {
    try {
        const brands = await Product.aggregate([
            { $match: { status: { $in: ["active", "outofstock"] } } },
            {
                $group: {
                    _id: { $toLower: "$brand" }, // Normalize to lowercase for grouping
                    originalName: { $first: "$brand" }, // Capture the first casing encountered
                    count: { $sum: 1 },
                },
            },
            { $sort: { originalName: 1 } },
        ]);

        // Map to a clean format for the frontend
        const formattedBrands = brands.map((b) => ({
            name: b.originalName || "Generic",
            count: b.count,
            id: b.originalName, // Name acts as ID for filter logic
        }));

        res.json({ success: true, brands: formattedBrands });
    } catch (err) {
        console.error("Error fetching brands:", err);
        res.status(500).json({ success: false, error: "Failed to fetch brands" });
    }
};

module.exports = getBrandsWithCounts;