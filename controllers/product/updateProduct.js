const Product = require("../../models/Product");

const updateProduct = async (req, res) => {
    try {
        const {
            name,
            description = "",
            sku,
            actualPrice,
            offerPrice,
            stock,
            status = "active",
            visibility = "public",
            publishDate,
            tags = "",
            category,
            brand,
        } = req.body;

        if (!name || !actualPrice || !offerPrice || !stock || !category) {
            return res.status(400).json({ success: false, error: "Required fields missing" });
        }

        // Process tags into an array
        const tagArray = tags
            ? tags.split(",").map((t) => t.trim()).filter((t) => t)
            : [];

        const updateData = {
            name: name.trim(),
            description: description.trim(),
            sku: sku?.trim(),
            actualPrice: parseFloat(actualPrice),
            offerPrice: parseFloat(offerPrice),
            stock: parseInt(stock),
            status,
            visibility,
            publishDate: publishDate ? new Date(publishDate) : undefined,
            tags: tagArray,
            brand: brand || "Generic",
            category,
        };

        // Handle new image uploads if present
        if (req.files?.mainImage) {
            updateData.mainImage = req.files.mainImage[0].path;
        }
        if (req.files?.gallery) {
            updateData.gallery = req.files.gallery.map((f) => f.path);
        }

        const updated = await Product.findByIdAndUpdate(req.params.id, updateData, {
            new: true,
        });

        if (!updated) {
            return res.status(404).json({ success: false, error: "Product not found" });
        }

        res.json({
            success: true,
            message: "Product updated successfully",
            updated,
        });
    } catch (err) {
        console.error(err);
        if (err.code === 11000) {
            return res.status(400).json({ success: false, error: "SKU already exists" });
        }
        res.status(500).json({ success: false, error: "Server error" });
    }
};

module.exports = updateProduct;