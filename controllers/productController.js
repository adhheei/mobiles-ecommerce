// controllers/productController.js
const Product = require("../models/Product");
const Category = require("../models/Category");
const path = require("path");
const fs = require("fs");

function formatImageUrl(filePath) {
  if (!filePath) return "";
  return "/" + filePath.replace(/\\/g, "/").replace(/^public\//, "").replace(/^\//, "");
}
console.log("formatImageUrl defined");

// GET all products

exports.getAllProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build query
    let query = {};
    if (req.query.search) {
      query.name = { $regex: req.query.search, $options: 'i' };
    }
    if (req.query.category && req.query.category !== 'all') {
      query.category = req.query.category;
    }

    // Get total count
    const total = await Product.countDocuments(query);

    // Get products with pagination
    const products = await Product.find(query)
      .populate('category', 'name')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    // Format data
    const formatted = products.map(p => {
      // Debug check
      if (typeof formatImageUrl !== 'function') {
        console.error("CRITICAL: formatImageUrl is NOT a function:", typeof formatImageUrl);
      }
      const formattedImage = formatImageUrl(p.mainImage);
      console.log(`[Debug Path] ID: ${p._id} | DB Path: "${p.mainImage}" | Formatted: "${formattedImage}"`);

      return {
        id: p._id.toString(),
        name: p.name,
        sku: p.sku || "",
        actualPrice: p.actualPrice,
        offerPrice: p.offerPrice,
        stock: p.stock,
        category: p.category?.name || "No Category",
        mainImage: formattedImage,
        status: p.status,
      };
    });

    // Calculate pagination
    const totalPages = Math.ceil(total / limit);

    // ✅ RETURN CORRECT STRUCTURE
    res.json({
      success: true,
      formatted: formatted, // Matches frontend expectation
      pagination: {
        total: total,
        page: page,
        pages: totalPages
      }
    });
  } catch (err) {
    console.error("Critical Error in getAllProducts:", err);
    res.status(500).json({
      success: false,
      error: "Failed to load products",
      details: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};


// getProductById function
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate(
      "category",
      "name"
    );
    if (!product) {
      return res
        .status(404)
        .json({ success: false, error: "Product not found" });
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
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Failed to fetch product" });
  }
};

// ✅ GET categories for dropdown
exports.getCategoriesForDropdown = async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true }, 'name');
    res.json({ success: true, categories }); // ✅ Matches frontend expectation
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to load categories' });
  }
};


// ✅ ADD product
exports.addProduct = async (req, res) => {
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
    } = req.body;

    if (!name || !actualPrice || !offerPrice || !stock || !category) {
      return res
        .status(400)
        .json({ success: false, error: "Required fields missing" });
    }

    const tagArray = tags
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t);

    const productData = {
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
      category,
    };

    if (req.files?.mainImage) {
      productData.mainImage = req.files.mainImage[0].path;
    }
    if (req.files?.gallery) {
      productData.gallery = req.files.gallery.map((f) => f.path);
    }

    const product = new Product(productData);
    await product.save();

    res
      .status(201)
      .json({ success: true, message: "Product added successfully" });
  } catch (err) {
    console.error(err);
    if (err.code === 11000) {
      return res
        .status(400)
        .json({ success: false, error: "SKU already exists" });
    }
    res.status(500).json({ success: false, error: "Server error" });
  }
};

// ✅ UPDATE product
// UPDATE product
exports.updateProduct = async (req, res) => {
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
    } = req.body;

    if (!name || !actualPrice || !offerPrice || !stock || !category) {
      return res
        .status(400)
        .json({ success: false, error: "Required fields missing" });
    }

    const tagArray = tags
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t);

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
      category,
    };

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
      return res
        .status(404)
        .json({ success: false, error: "Product not found" });
    }

    // ✅ RETURN SUCCESS RESPONSE WITH MESSAGE
    res.json({ 
      success: true, 
      message: "Product updated successfully",
      // Optional: return updated product data
       updated 
    });
  } catch (err) {
    console.error(err);
    if (err.code === 11000) {
      return res
        .status(400)
        .json({ success: false, error: "SKU already exists" });
    }
    res.status(500).json({ success: false, error: "Server error" });
  }
};

// ✅ DELETE product
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res
        .status(404)
        .json({ success: false, error: "Product not found" });
    }

    // Delete main image
    if (product.mainImage) {
      const mainImagePath = path.join(__dirname, "..", "..", product.mainImage);
      if (fs.existsSync(mainImagePath)) {
        fs.unlinkSync(mainImagePath);
      }
    }

    // Delete gallery images
    if (product.gallery && product.gallery.length > 0) {
      product.gallery.forEach((imgPath) => {
        const galleryPath = path.join(__dirname, "..", "..", imgPath);
        if (fs.existsSync(galleryPath)) {
          fs.unlinkSync(galleryPath);
        }
      });
    }

    res.json({ success: true, message: "Product permanently deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Failed to delete product" });
  }
};
