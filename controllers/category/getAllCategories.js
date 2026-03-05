const Category = require("../../models/Category");
const Product = require("../../models/Product");
const path = require("path");

const getAllCategories = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";
    const sort = req.query.sort || "newest";
    const skip = (page - 1) * limit;

    let query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    // Sort mapping
    let sortQuery = { createdAt: -1 };
    if (sort === "oldest") sortQuery = { createdAt: 1 };
    else if (sort === "name-asc") sortQuery = { name: 1 };
    else if (sort === "name-desc") sortQuery = { name: -1 };

    const total = await Category.countDocuments(query);
    const categories = await Category.find(query)
      .sort(sortQuery)
      .skip(skip)
      .limit(limit);

    const formatted = await Promise.all(
      categories.map(async (cat) => {
        const productCount = await Product.countDocuments({ category: cat._id });
        return {
          id: cat._id.toString(),
          name: cat.name,
          desc: cat.description || "",
          img: cat.image
            ? `/uploads/categories/${path.basename(cat.image)}`
            : "/images/logo.jpg",
          products: productCount,
          isActive: cat.isActive,
        };
      })
    );

    res.json({
      success: true,
      data: formatted,
      pagination: { total, page, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error("Error in getAllCategories:", err);
    res.status(500).json({ success: false, error: "Failed to load categories" });
  }
};

module.exports = getAllCategories;