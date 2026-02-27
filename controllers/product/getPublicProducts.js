const Product = require("../../models/Product");

const getPublicProducts = async (req, res) => {
    try {
        const { page = 1, limit = 12, sort, category, brand, inStock, maxPrice, search } = req.query;
        let query = { isDeleted: false };

        if (brand) {
            const brandArray = brand.split(",");
            query.brand = { $in: brandArray.map((b) => new RegExp(`^${b}$`, "i")) };
        }
        if (category) query.category = { $in: category.split(",") };
        if (maxPrice) query.offerPrice = { $lte: Number(maxPrice) };
        if (inStock === "true") query.stock = { $gt: 0 };
        if (search) query.name = { $regex: search, $options: "i" };

        let sortOptions = { createdAt: -1 };
        if (sort === "price-low-high") sortOptions = { offerPrice: 1 };
        if (sort === "price-high-low") sortOptions = { offerPrice: -1 };

        const products = await Product.find(query)
            .sort(sortOptions)
            .skip((page - 1) * limit)
            .limit(Number(limit));

        const total = await Product.countDocuments(query);

        res.json({
            success: true,
            products,
            pagination: { total, page: Number(page), pages: Math.ceil(total / limit) },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = getPublicProducts;