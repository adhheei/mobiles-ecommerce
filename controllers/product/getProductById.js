const Product = require("../../models/Product");
const { formatImageUrl } = require("./utils");

const getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id).populate(
            "category",
            "name"
        );
        
        if (!product) {
            return res.status(404).json({ success: false, error: "Product not found" });
        }

        const mainImageUrl = formatImageUrl(product.mainImage);
        const galleryUrls = Array.isArray(product.gallery)
            ? product.gallery.map((imgPath) => formatImageUrl(imgPath))
            : [];

        res.json({
            success: true,
            product: {
                _id: product._id,
                name: product.name,
                description: product.description,
                sku: product.sku,
                actualPrice: product.actualPrice,
                offerPrice: product.offerPrice,
                stock: product.stock,
                category: product.category?._id.toString() || "",
                status: product.status,
                visibility: product.visibility,
                publishDate: product.publishDate,
                tags: product.tags,
                mainImage: mainImageUrl,
                gallery: galleryUrls,
                brand: product.brand,
            },
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: "Failed to fetch product" });
    }
};

module.exports = getProductById;