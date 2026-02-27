const Product = require("../../models/Product");

const addProduct = async (req, res) => {
    try {
        const { name, description, sku, price, stock, category, brand, status, visibility, publishDate } = req.body;
        const parsedPrice = parseFloat(price);
        const parsedStock = parseInt(stock);

        if (!name || isNaN(parsedPrice) || isNaN(parsedStock) || !category) {
            return res.status(400).json({ success: false, error: "Required fields missing." });
        }

        const productData = {
            name: name.trim(),
            description: description?.trim() || "",
            sku: sku?.trim() || undefined,
            actualPrice: parsedPrice,
            offerPrice: parsedPrice,
            stock: parsedStock,
            status: status || "active",
            visibility: visibility || "public",
            publishDate: publishDate ? new Date(publishDate) : new Date(),
            brand: brand || "Generic",
            category,
        };

        if (req.files) {
            if (req.files.mainImage?.[0]) {
                productData.mainImage = req.files.mainImage[0].path.replace(/\\/g, "/");
            }
            if (req.files.gallery) {
                productData.gallery = req.files.gallery.map((f) => f.path.replace(/\\/g, "/"));
            }
        }

        const product = new Product(productData);
        await product.save();

        res.status(201).json({ success: true, message: "Product added successfully" });
    } catch (err) {
        if (err.code === 11000) return res.status(400).json({ success: false, error: "SKU already exists." });
        res.status(500).json({ success: false, error: err.message });
    }
};

module.exports = addProduct;