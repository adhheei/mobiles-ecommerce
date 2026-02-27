const Category = require("../../models/Category");

const createCategory = async (req, res) => {
  try {
    const { name, description = "", isActive = "true" } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ success: false, error: "Category name is required" });
    }

    const existing = await Category.findOne({
      name: { $regex: new RegExp(`^${name.trim()}$`, "i") },
    });
    if (existing) {
      return res.status(400).json({ success: false, error: "Category name already exists" });
    }

    const category = new Category({
      name: name.trim(),
      description: description.trim(),
      isActive: isActive === "true",
      image: req.file ? req.file.path : "",
    });

    await category.save();
    res.status(201).json({ success: true, message: "Category created successfully" });
  } catch (err) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ success: false, error: "File too large. Max 10MB." });
    }
    if (err.message?.includes("image")) {
      return res.status(400).json({ success: false, error: "Invalid file type. Only images allowed." });
    }
    res.status(500).json({ success: false, error: "Failed to create category" });
  }
};

module.exports = createCategory;