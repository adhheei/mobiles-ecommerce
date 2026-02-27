const Product = require("../../models/Product");
const path = require("path");
const fs = require("fs");

/**
 * @desc    Permanently delete product and its associated images
 * @route   DELETE /api/admin/products/:id
 * @access  Private/Admin
 */
const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;

        // 1. Find the product first to get image paths
        const product = await Product.findById(id);
        
        if (!product) {
            return res.status(404).json({ 
                success: false, 
                error: "Product not found" 
            });
        }

        // 2. Delete the Main Image file from storage
        if (product.mainImage) {
            const mainImagePath = path.join(__dirname, "..", "..", product.mainImage);
            if (fs.existsSync(mainImagePath)) {
                fs.unlinkSync(mainImagePath);
            }
        }

        // 3. Delete all Gallery Image files from storage
        if (product.gallery && product.gallery.length > 0) {
            product.gallery.forEach((imgPath) => {
                const galleryPath = path.join(__dirname, "..", "..", imgPath);
                if (fs.existsSync(galleryPath)) {
                    fs.unlinkSync(galleryPath);
                }
            });
        }

        // 4. Finally, remove the document from MongoDB
        await Product.findByIdAndDelete(id);

        res.json({ 
            success: true, 
            message: "Product and associated images permanently deleted" 
        });
    } catch (err) {
        console.error("Delete Product Error:", err);
        res.status(500).json({ 
            success: false, 
            error: "Failed to delete product" 
        });
    }
};

module.exports = deleteProduct;