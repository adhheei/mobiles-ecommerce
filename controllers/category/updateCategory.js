const Category = require("../../models/Category");

const updateCategory = async (req, res) => {
  try {
    const { name, description = "", isActive = "true" } = req.body;
    const categoryId = req.params.id;

    if (!name?.trim()) {
      return res.status(400).json({ success: false, error: "Category name is required" });
    }

    const existing = await Category.findOne({
      _id: { $ne: categoryId },
      name: { $regex: new RegExp(`^${name.trim()}$`, "i") },
    });
    if (existing) {
      return res.status(400).json({ success: false, error: "Category name already exists" });
    }

    const updateData = {
      name: name.trim(),
      description: description.trim(),
      isActive: isActive === "true",
    };

    if (req.file) updateData.image = req.file.path;

    const updated = await Category.findByIdAndUpdate(categoryId, updateData, {
      new: true,
      runValidators: true,
    });

    if (!updated) {
      return res.status(404).json({ success: false, error: "Category not found" });
    }

    res.json({ success: true, message: "Category updated successfully" });
  } catch (err) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ success: false, error: "File too large. Max 10MB." });
    }
    if (err.message?.includes("image")) {
      return res.status(400).json({ success: false, error: "Invalid file type. Only images allowed." });
    }
    res.status(500).json({ success: false, error: "Failed to update category" });
  }
};

module.exports = updateCategory;