const Product = require("../../models/Product");
const { formatImageUrl } = require("./utils");

const getAllProducts = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const { search, category, sort = "newest" } = req.query;

        let query = {};
        if (search) query.name = { $regex: search, $options: "i" };
        if (category && category !== "all") query.category = category;

        let sortObj = {};
        switch (sort) {
            case "name-asc": sortObj = { name: 1 }; break;
            case "name-desc": sortObj = { name: -1 }; break;
            case "price-low": sortObj = { offerPrice: 1 }; break;
            case "price-high": sortObj = { offerPrice: -1 }; break;
            case "oldest": sortObj = { createdAt: 1 }; break;
            default: sortObj = { createdAt: -1 };
        }

        const total = await Product.countDocuments(query);
        const products = await Product.find(query)
            .populate("category", "name")
            .sort(sortObj)
            .skip(skip)
            .limit(limit);

        const formatted = products.map((p) => ({
            id: p._id.toString(),
            name: p.name,
            sku: p.sku || "",
            actualPrice: p.actualPrice,
            offerPrice: p.offerPrice,
            stock: p.stock,
            category: p.category?.name || "No Category",
            mainImage: formatImageUrl(p.mainImage),
            status: p.status,
        }));

        res.json({
            success: true,
            formatted,
            pagination: { total, page, pages: Math.ceil(total / limit) },
        });
    } catch (err) {
        res.status(500).json({ success: false, error: "Failed to load products" });
    }
};

module.exports = getAllProducts;