const Product = require("../../models/Product");
const path = require("path");

const getPublicProducts = async (req, res) => {
    try {
        const {
            page = 1, limit = 20, sort, category, brand, inStock, onSale, maxPrice, search
        } = req.query;

        let query = { status: "active", visibility: "public" };

        if (category && category !== "all") {
            const categories = category.split(",");
            if (categories.length > 0) query.category = { $in: categories };
        }

        if (brand) {
            const brands = brand.split(",");
            if (brands.length > 0) {
                query.brand = { $in: brands.map((b) => new RegExp(`^${b}$`, "i")) };
            }
        }

        if (maxPrice) query.offerPrice = { $lte: Number(maxPrice) };
        if (inStock === "true") query.stock = { $gt: 0 };
        if (onSale === "true") query.$expr = { $lt: ["$offerPrice", "$actualPrice"] };

        if (search) {
            const searchRegex = new RegExp(search, "i");
            query.$or = [{ name: searchRegex }, { description: searchRegex }, { brand: searchRegex }];
        }

        let sortOptions = { createdAt: -1 };
        switch (sort) {
            case "price_low": sortOptions = { offerPrice: 1 }; break;
            case "price_high": sortOptions = { offerPrice: -1 }; break;
            case "a_z": sortOptions = { name: 1 }; break;
            case "z_a": sortOptions = { name: -1 }; break;
            default: sortOptions = { createdAt: -1 };
        }

        const skip = (page - 1) * limit;
        const products = await Product.find(query)
            .populate("category", "_id name")
            .sort(sortOptions)
            .skip(skip)
            .limit(Number(limit));

        const total = await Product.countDocuments(query);

        const formatted = products.map((p) => ({
            id: p._id.toString(),
            name: p.name,
            actualPrice: p.actualPrice,
            offerPrice: p.offerPrice,
            stock: p.stock,
            brand: p.brand || "Generic",
            categoryName: p.category?.name || "Uncategorized",
            category: p.category?._id.toString() || "",
            mainImage: p.mainImage ? `/uploads/products/${path.basename(p.mainImage)}` : "/images/logo.jpg",
        }));

        res.json({
            success: true,
            products: formatted,
            pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit) },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = getPublicProducts;