// controllers/productController.js
const Product = require("../models/Product");
const Category = require("../models/Category");
const path = require("path");
const fs = require("fs");

function formatImageUrl(filePath) {
  if (!filePath) return "";
  return (
    "/" +
    filePath
      .replace(/\\/g, "/")
      .replace(/^public\//, "")
      .replace(/^\//, "")
  );
}
console.log("formatImageUrl defined");

// GET all products
exports.getAllProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const { search, category, sort = "newest" } = req.query; // 👈 Get sort param

    // Build query
    let query = {};
    if (search) {
      query.name = { $regex: search, $options: "i" };
    }
    if (category && category !== "all") {
      query.category = category;
    }

    // 👇 BUILD SORT OBJECT BASED ON FRONTEND VALUE
    let sortObj = {};
    switch (sort) {
      case "name-asc":
        sortObj = { name: 1 };
        break;
      case "name-desc":
        sortObj = { name: -1 };
        break;
      case "price-low":
        sortObj = { offerPrice: 1 };
        break;
      case "price-high":
        sortObj = { offerPrice: -1 };
        break;
      case "oldest":
        sortObj = { createdAt: 1 };
        break;
      default: // 'newest'
        sortObj = { createdAt: -1 };
    }

    // Get total count
    const total = await Product.countDocuments(query);
    console.log(`[DEBUG] getAllProducts query:`, JSON.stringify(query), `Total:`, total);

    // Get products with pagination AND sorting
    const products = await Product.find(query)
      .populate("category", "name")
      .sort(sortObj) // 👈 Apply dynamic sort
      .skip(skip)
      .limit(limit);

    // Format data
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

    // Calculate pagination
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      formatted,
      pagination: {
        total,
        page,
        pages: totalPages,
      },
    });
  } catch (err) {
    console.error("Critical Error in getAllProducts:", err);
    res.status(500).json({
      success: false,
      error: "Failed to load products",
    });
  }
};

exports.getPublicProducts = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 12,
            category,
            brand,
            search,
            sort,
            inStock,
            maxPrice,
        } = req.query;

        // 1. Build a clean query object
        let query = { isDeleted: false }; // Ensure your model uses this flag

        if (search && search.trim() !== "") {
            query.name = { $regex: search.trim(), $options: "i" };
        }

        if (category && category !== "all" && category !== "") {
            const categoryArray = category.split(",");
            query.category = { $in: categoryArray };
        }

        if (brand && brand !== "all" && brand !== "") {
            const brandArray = brand.split(",");
            const brandRegexArray = brandArray.map((b) => new RegExp(`^${b}$`, "i"));
            query.brand = { $in: brandRegexArray };
        }

        if (inStock === "true") {
            query.stock = { $gt: 0 };
        }

        if (maxPrice) {
            query.offerPrice = { $lte: parseInt(maxPrice) };
        }

        // 2. Build Sort Object
        let sortObj = { createdAt: -1 };
        if (sort === "price-low-high") sortObj = { offerPrice: 1 };
        if (sort === "price-high-low") sortObj = { offerPrice: -1 };

        const skip = (page - 1) * limit;

        // 3. CRITICAL: Fetch with Population to fix the "Blank CategoryID" error
        const products = await Product.find(query)
            .populate("category", "name") // Join category data
            .sort(sortObj)
            .skip(skip)
            .limit(Number(limit));

        const total = await Product.countDocuments(query);

        // 4. Format the response for your Jinsa Mobiles frontend
        const formatted = products.map((p) => ({
            _id: p._id.toString(),
            name: p.name,
            actualPrice: p.actualPrice,
            offerPrice: p.offerPrice,
            stock: p.stock,
            brand: p.brand || "Generic",
            categoryName: p.category?.name || "Uncategorized",
            // This ensures images load correctly regardless of path format
            mainImage: p.mainImage 
                ? (p.mainImage.startsWith('/') ? p.mainImage : `/uploads/products/${path.basename(p.mainImage)}`)
                : "/images/logo.jpg",
        }));

        res.json({
            success: true,
            products: formatted,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / limit),
            },
        });
    } catch (err) {
        console.error("Critical Error in getPublicProducts:", err);
        res.status(500).json({ success: false, error: "Internal Server Error: Failed to fetch products" });
    }
};

// getProductById function
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate(
      "category",
      "name",
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
        brand: product.brand
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
    const categories = await Category.find({ isActive: true }, "name");
    console.log(`[DEBUG] getCategoriesForDropdown found:`, categories.length);
    res.json({ success: true, categories }); // ✅ Matches frontend expectation
  } catch (err) {
    res
      .status(500)
      .json({ success: false, error: "Failed to load categories" });
  }
};

// ADD THIS FUNCTION
exports.getCategoriesWithCounts = async (req, res) => {
  try {
    const Category = require('../models/Category');
    const Product = require('../models/Product');

    const categories = await Category.find({ isActive: true });
    const categoriesWithCounts = await Promise.all(
      categories.map(async (cat) => {
        const productCount = await Product.countDocuments({
          category: cat._id,
          stock: { $gt: 0 }
        });
        return {
          _id: cat._id.toString(),
          name: cat.name,
          productCount: productCount
        };
      })
    );
    res.json({ success: true, categories: categoriesWithCounts });
  } catch (err) {
    console.error(err);
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
      brand
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
      brand: brand || 'Generic',
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
      brand
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
      brand: brand || 'Generic',
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
      updated,
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

exports.getUniqueBrands = async (req, res) => {
  try {
    // Gets unique brand strings from products that aren't deleted
    const brands = await Product.distinct('brand', { isDeleted: false });

    res.status(200).json({
      success: true,
      brands: brands.filter(b => b) // Removes any null/undefined values
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getPublicProducts = async (req, res) => {
  try {
    const { page = 1, limit = 12, sort, category, brand, inStock, maxPrice, search } = req.query;

    // Build Query Object
    let query = { isDeleted: false };

    // Brand Filter: Handles comma-separated values from frontend
    if (brand) {
      const brandArray = brand.split(',');
      query.brand = { $in: brandArray.map(b => new RegExp(`^${b}$`, 'i')) };
    }

    // Category Filter
    if (category) {
      query.category = { $in: category.split(',') };
    }

    // Price Filter
    if (maxPrice) {
      query.offerPrice = { $lte: Number(maxPrice) };
    }

    // Stock Filter
    if (inStock === 'true') {
      query.stock = { $gt: 0 };
    }

    // Search Filter
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    // Sorting Logic
    let sortOptions = { createdAt: -1 }; // Default: Newest
    if (sort === 'price-low-high') sortOptions = { offerPrice: 1 };
    if (sort === 'price-high-low') sortOptions = { offerPrice: -1 };

    const skip = (page - 1) * limit;
    const products = await Product.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(Number(limit));

    const total = await Product.countDocuments(query);

    res.json({
      success: true,
      products,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};