// controllers/publicProductController.js
const Product = require("../models/Product");
const Category = require("../models/Category");
const path = require("path");

// Get categories with product counts for filtering
exports.getCategoriesWithCounts = async (req, res) => {
  try {
    // Get all active categories
    const categories = await Category.find({ isActive: true });

    // Get product count for each category (only in-stock products)
    const categoriesWithCounts = await Promise.all(
      categories.map(async (cat) => {
        const productCount = await Product.countDocuments({
          category: cat._id,
          stock: { $gt: 0 },
          status: "active",
        });
        return {
          _id: cat._id.toString(),
          name: cat.name,
          productCount: productCount,
        };
      }),
    );

    res.json({ success: true, categories: categoriesWithCounts });
  } catch (err) {
    console.error("Error fetching categories with counts:", err);
    res
      .status(500)
      .json({ success: false, error: "Failed to load categories" });
  }
};

exports.getPublicProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      sort,
      category,
      brand,
      inStock,
      onSale, // 1. Extract onSale from query
      maxPrice,
      search,
    } = req.query;

    let query = { status: "active", visibility: "public" };

    // Filtering Logic
    if (category && category !== "all") {
      const categories = category.split(",");
      if (categories.length > 0) {
        query.category = { $in: categories };
      }
    }

    if (brand) {
      // Split by comma if multiple brands are selected
      const brands = brand.split(",");
      if (brands.length > 0) {
        // Case-insensitive match for brands
        query.brand = { $in: brands.map((b) => new RegExp(`^${b}$`, "i")) };
      }
    }

    if (maxPrice) {
      query.offerPrice = { $lte: Number(maxPrice) };
    }

    if (inStock === "true") {
      query.stock = { $gt: 0 };
    }

    if (onSale === "true") {
      // Filters products where the offerPrice is strictly less than the actualPrice
      query.$expr = { $lt: ["$offerPrice", "$actualPrice"] };
    }

    if (maxPrice) {
      query.offerPrice = { $lte: Number(maxPrice) };
    }

    if (search) {
      const searchRegex = new RegExp(search, "i");
      query.$or = [
        { name: searchRegex },
        { description: searchRegex },
        { brand: searchRegex }, // Also search via brand
      ];
    }

    // Sorting Logic
    let sortOptions = {}; // Default: No specific sort (natural order)
    switch (sort) {
      case "newest":
        sortOptions = { createdAt: -1 };
        break;
      case "price_low":
        sortOptions = { offerPrice: 1 };
        break;
      case "price_high":
        sortOptions = { offerPrice: -1 };
        break;
      case "a_z":
        sortOptions = { name: 1 };
        break;
      case "z_a":
        sortOptions = { name: -1 };
        break;
      default:
        sortOptions = { createdAt: -1 }; // Default to newest if not specified
    }

    const skip = (page - 1) * limit;

    const products = await Product.find(query)
      .populate("category", "_id name")
      .sort(sortOptions)
      .skip(skip)
      .limit(Number(limit));

    const total = await Product.countDocuments(query);

    // Format for frontend
    const formatted = products.map((p) => ({
      id: p._id.toString(),
      name: p.name,
      actualPrice: p.actualPrice,
      offerPrice: p.offerPrice,
      stock: p.stock,
      brand: p.brand || "Generic",
      categoryName: p.category?.name || "Uncategorized",
      category: p.category?._id.toString() || "",
      mainImage: p.mainImage
        ? `/uploads/products/${path.basename(p.mainImage)}`
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
  } catch (error) {
    console.error("Error in getPublicProducts:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getBrandsWithCounts = async (req, res) => {
  try {
    const brands = await Product.aggregate([
      { $match: { status: { $in: ["active", "outofstock"] } } },
      {
        $group: {
          _id: { $toLower: "$brand" }, // Group by lowercase brand to normalize
          originalName: { $first: "$brand" }, // Keep one original casing
          count: { $sum: 1 },
        },
      },
      { $sort: { originalName: 1 } },
    ]);

    // Map to cleaner format, handle Generic/null
    const formattedBrands = brands.map((b) => ({
      name: b.originalName || "Generic",
      count: b.count,
      id: b.originalName, // Use name as ID for simplicity in frontend
    }));

    res.json({ success: true, brands: formattedBrands });
  } catch (err) {
    console.error("Error fetching brands:", err);
    res.status(500).json({ success: false, error: "Failed to fetch brands" });
  }
};

exports.getSearchSuggestions = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 1) {
      return res.json({ success: true, suggestions: [] });
    }

    const regex = new RegExp(q, "i");

    // Search active products
    const products = await Product.find({
      $or: [{ name: regex }, { description: regex }],
      status: { $in: ["active", "outofstock"] }, // Exclude drafts
    })
      .select("name _id mainImage category brand")
      .populate("category", "name")
      .limit(5);

    // Search categories
    const categories = await Category.find({
      name: regex,
    })
      .select("name _id")
      .limit(3);

    const suggestions = [];

    categories.forEach((cat) => {
      suggestions.push({
        type: "category",
        label: cat.name,
        id: cat._id,
        url: `./productPage.html?category=${cat._id}`,
      });
    });

    products.forEach((prod) => {
      suggestions.push({
        type: "product",
        label: prod.name,
        image: prod.mainImage
          ? `/uploads/products/${path.basename(prod.mainImage)}`
          : "/images/logo.jpg",
        id: prod._id,
        url: `./singleProductPage.html?id=${prod._id}`,
      });
    });

    res.json({ success: true, suggestions });
  } catch (err) {
    console.error("Error in getSearchSuggestions:", err);
    res.status(500).json({ success: false, error: "Search failed" });
  }
};

exports.getSuggestions = async (req, res) => {
  try {
    const { cartProductIds } = req.body;
    let excludeIds = [];
    if (cartProductIds && Array.isArray(cartProductIds)) {
      excludeIds = cartProductIds;
    }

    // 1. Analyze Cart Items
    let cartBrands = [];
    let cartCategories = []; // IDs

    if (excludeIds.length > 0) {
      const cartItems = await Product.find({ _id: { $in: excludeIds } }).select(
        "category brand name",
      );
      cartBrands = cartItems
        .map((p) => p.brand)
        .filter((b) => b && b !== "Generic");
      cartCategories = cartItems.map((p) => p.category);

      // Remove duplicates
      cartBrands = [...new Set(cartBrands)];

      // Filter out null categories if any
      cartCategories = cartCategories.filter((c) => c);
    }

    // 2. Find "Accessories" Category ID (heuristic)
    // We look for categories with "Accessory" or "Accessories" in name
    const accessoryCategories = await Category.find({
      name: { $regex: /accessor/i },
      isActive: true,
    }).select("_id");

    const accessoryCategoryIds = accessoryCategories.map((c) => c._id);

    // 3. Build Accessory Query
    // Strategy:
    // A. Properties: Brand match AND (Category is Accessory OR Name has keywords)
    // B. Fallback: Same category as cart items (Cross-sell)

    const keywords = [
      "Case",
      "Cover",
      "Glass",
      "Screen Guard",
      "Charger",
      "Adapter",
      "Headset",
      "Cable",
    ];
    const keywordRegex = keywords.map((k) => new RegExp(k, "i"));

    let query = {
      _id: { $nin: excludeIds },
      status: "active",
      stock: { $gt: 0 },
    };

    // Primary goal: Find accessories for the brands in cart
    let conditions = [];

    if (cartBrands.length > 0) {
      // Condition 1: Same Brand + Accessory Category
      if (accessoryCategoryIds.length > 0) {
        conditions.push({
          brand: { $in: cartBrands },
          category: { $in: accessoryCategoryIds },
        });
      }
      // Condition 2: Same Brand + Keyword in Name
      conditions.push({
        brand: { $in: cartBrands },
        name: { $in: keywordRegex },
      });

      // Condition 3: Just Accessory Category (allow other brands if general accessories)
      if (accessoryCategoryIds.length > 0) {
        conditions.push({
          category: { $in: accessoryCategoryIds },
        });
      }
    } else {
      // No Brands? Just show Popular Accessories
      if (accessoryCategoryIds.length > 0) {
        conditions.push({
          category: { $in: accessoryCategoryIds },
        });
      }
    }

    // Fallback: Same category as cart items
    if (cartCategories.length > 0) {
      conditions.push({
        category: { $in: cartCategories },
      });
    }

    if (conditions.length > 0) {
      query.$or = conditions;
    }

    // 4. Fetch Products
    let products = await Product.find(query)
      .populate("category", "name")
      .limit(8)
      .sort({ createdAt: -1 }); // Newest first

    // 5. Fallback if not enough
    if (products.length < 3) {
      const moreProducts = await Product.find({
        _id: { $nin: [...excludeIds, ...products.map((p) => p._id)] },
        status: "active",
        stock: { $gt: 0 },
      })
        .limit(6 - products.length)
        .sort({ createdAt: -1 });

      products = [...products, ...moreProducts];
    }

    // Deduplicate (just in case)
    const uniqueProducts = [];
    const seenMap = new Set();
    products.forEach((p) => {
      if (!seenMap.has(p._id.toString())) {
        seenMap.add(p._id.toString());
        uniqueProducts.push(p);
      }
    });

    // Limit to 6
    products = uniqueProducts.slice(0, 6);

    // Format
    const formatted = products.map((p) => ({
      id: p._id.toString(),
      name: p.name,
      offerPrice: p.offerPrice,
      actualPrice: p.actualPrice,
      image: p.mainImage
        ? `/uploads/products/${path.basename(p.mainImage)}`
        : "/images/logo.jpg",
      category: p.category?.name,
    }));

    res.json({ success: true, products: formatted });
  } catch (err) {
    console.error("Error fetching suggestions:", err);
    res.status(500).json({ success: false, error: "Failed" });
  }
};
