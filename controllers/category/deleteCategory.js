const Category = require("../../models/Category");
const path = require("path");
const fs = require("fs");

const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, error: "Category not found" });
    }

    if (category.image) {
      const imagePath = path.join(__dirname, "..", "..", category.image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    res.json({ success: true, message: "Category permanently deleted" });
  } catch (err) {
    res.status(500).json({ success: false, error: "Failed to delete category" });
  }
};

module.exports = deleteCategory;