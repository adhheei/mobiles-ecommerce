const Category = require("../../models/Category");
const path = require("path");

const getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, error: "Category not found" });
    }

    let imageUrl = category.image 
      ? `/uploads/categories/${path.basename(category.image)}` 
      : "";

    res.json({
      success: true,
      data: {
        _id: category._id,
        name: category.name,
        description: category.description,
        isActive: category.isActive,
        image: imageUrl,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Failed to fetch category" });
  }
};

module.exports = getCategoryById;