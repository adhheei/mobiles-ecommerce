// routes/categories.js
const express = require("express");
const Category = require("../models/Category");
const upload = require("../middleware/upload");
const router = express.Router();
const path = require("path");

// GET all categories (for admin list)
router.get("/", async (req, res) => {
  try {
    const categories = await Category.find().sort({ createdAt: -1 });
    const formatted = categories.map((cat) => ({
      id: cat._id.toString(),
      name: cat.name,
      desc: cat.description || "",
      // ✅ Use existing logo.jpg instead of missing default-category.png
      img: cat.image
        ? `/uploads/categories/${path.basename(cat.image)}`
        : "/images/logo.jpg",
      products: Math.floor(Math.random() * 50), // Replace later with real count
      isActive: cat.isActive,
    }));
    res.json({ success: true, data: formatted });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ success: false, error: "Failed to load categories" });
  }
});

// POST: Add new category
router.post("/", upload.single("image"), async (req, res) => {
  try {
    const { name, description = "", isActive = "true" } = req.body;

    if (!name || !name.trim()) {
      return res
        .status(400)
        .json({ success: false, error: "Category name is required" });
    }

    const existing = await Category.findOne({
      name: { $regex: new RegExp(`^${name.trim()}$`, "i") },
    });
    if (existing) {
      return res
        .status(400)
        .json({ success: false, error: "Category name already exists" });
    }

    const category = new Category({
      name: name.trim(),
      description: description.trim(),
      isActive: isActive === "true",
      image: req.file ? req.file.path : "",
    });

    await category.save();

    res
      .status(201)
      .json({ success: true, message: "Category created successfully" });
  } catch (err) {
    console.error(err);
    if (err.code === "LIMIT_FILE_SIZE") {
      return res
        .status(400)
        .json({ success: false, error: "File too large. Max 10MB." });
    }
    if (err.message && err.message.includes("image")) {
      return res.status(400).json({
        success: false,
        error: "Invalid file type. Only images allowed.",
      });
    }
    res
      .status(500)
      .json({ success: false, error: "Failed to create category" });
  }
});

// DELETE: Permanently delete category
router.delete("/:id", async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);

    if (!category) {
      return res
        .status(404)
        .json({ success: false, error: "Category not found" });
    }

    // Optional: Delete image file from disk
    if (category.image) {
      const fs = require("fs");
      const imagePath = path.join(__dirname, "..", "..", category.image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    res.json({ success: true, message: "Category permanently deleted" });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ success: false, error: "Failed to delete category" });
  }
});

// GET: Fetch single category by ID
router.get("/:id", async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res
        .status(404)
        .json({ success: false, error: "Category not found" });
    }

    // ✅ Build full image URL
    let imageUrl = "";
    if (category.image) {
      // e.g., "public/uploads/categories/cat-123.jpg" → "/uploads/categories/cat-123.jpg"
      imageUrl = `/uploads/categories/${path.basename(category.image)}`;
    }

    res.json({
      success: true,
      data: {
        _id: category._id,
        name: category.name,
        description: category.description,
        isActive: category.isActive,
        image: imageUrl, // ✅ This is the public URL
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Failed to fetch category" });
  }
});

// PUT: Update category
router.put("/:id", upload.single("image"), async (req, res) => {
  try {
    const { name, description = "", isActive = "true" } = req.body;
    const categoryId = req.params.id;

    if (!name || !name.trim()) {
      return res
        .status(400)
        .json({ success: false, error: "Category name is required" });
    }

    // Check for duplicate name (excluding current category)
    const existing = await Category.findOne({
      _id: { $ne: categoryId },
      name: { $regex: new RegExp(`^${name.trim()}$`, "i") },
    });
    if (existing) {
      return res
        .status(400)
        .json({ success: false, error: "Category name already exists" });
    }

    // Build update object
    const updateData = {
      name: name.trim(),
      description: description.trim(),
      isActive: isActive === "true",
    };

    // Handle image
    if (req.file) {
      updateData.image = req.file.path; // new image
    }
    // If no file, keep existing image (don't update `image` field)

    const updated = await Category.findByIdAndUpdate(categoryId, updateData, {
      new: true,
      runValidators: true,
    });

    if (!updated) {
      return res
        .status(404)
        .json({ success: false, error: "Category not found" });
    }

    res.json({ success: true, message: "Category updated successfully" });
  } catch (err) {
    console.error(err);
    if (err.code === "LIMIT_FILE_SIZE") {
      return res
        .status(400)
        .json({ success: false, error: "File too large. Max 10MB." });
    }
    if (err.message && err.message.includes("image")) {
      return res.status(400).json({
        success: false,
        error: "Invalid file type. Only images allowed.",
      });
    }
    res
      .status(500)
      .json({ success: false, error: "Failed to update category" });
  }
});

module.exports = router;
