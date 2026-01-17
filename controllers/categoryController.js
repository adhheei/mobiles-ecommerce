// controllers/categoryController.js
const Category = require('../models/Category');
const path = require('path');
const fs = require('fs');

// @desc    Get all categories
// @route   GET /api/admin/categories
// @access  Public
exports.getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ createdAt: -1 });
    const formatted = categories.map(cat => ({
      id: cat._id.toString(),
      name: cat.name,
      desc: cat.description || '',
      img: cat.image
        ? `/uploads/categories/${path.basename(cat.image)}`
        : '/images/logo.jpg',
      products: Math.floor(Math.random() * 50),
      isActive: cat.isActive
    }));
    res.json({ success: true, data: formatted }); // ✅ "data", not "formatted"
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Failed to load categories' });
  }
};

// @desc    Get single category by ID
// @route   GET /api/admin/categories/:id
// @access  Public
exports.getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, error: 'Category not found' });
    }

    let imageUrl = '';
    if (category.image) {
      imageUrl = `/uploads/categories/${path.basename(category.image)}`;
    }

    res.json({
      success: true,
      data: {  // ✅ Fixed: added "data"
        _id: category._id,
        name: category.name,
        description: category.description,
        isActive: category.isActive,
        image: imageUrl
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Failed to fetch category' });
  }
};

// @desc    Create new category
// @route   POST /api/admin/categories
// @access  Admin
exports.createCategory = async (req, res) => {
  try {
    const { name, description = '', isActive = 'true' } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ success: false, error: 'Category name is required' });
    }

    const existing = await Category.findOne({
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') }
    });
    if (existing) {
      return res.status(400).json({ success: false, error: 'Category name already exists' });
    }

    const category = new Category({
      name: name.trim(),
      description: description.trim(),
      isActive: isActive === 'true',
      image: req.file ? req.file.path : ''
    });

    await category.save();
    res.status(201).json({ success: true, message: 'Category created successfully' });
  } catch (err) {
    console.error(err);
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ success: false, error: 'File too large. Max 10MB.' });
    }
    if (err.message && err.message.includes('image')) {
      return res.status(400).json({ success: false, error: 'Invalid file type. Only images allowed.' });
    }
    res.status(500).json({ success: false, error: 'Failed to create category' });
  }
};

// @desc    Update category
// @route   PUT /api/admin/categories/:id
// @access  Admin
exports.updateCategory = async (req, res) => {
  try {
    const { name, description = '', isActive = 'true' } = req.body;
    const categoryId = req.params.id;

    if (!name?.trim()) {
      return res.status(400).json({ success: false, error: 'Category name is required' });
    }

    const existing = await Category.findOne({
      _id: { $ne: categoryId },
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') }
    });
    if (existing) {
      return res.status(400).json({ success: false, error: 'Category name already exists' });
    }

    const updateData = {
      name: name.trim(),
      description: description.trim(),
      isActive: isActive === 'true'
    };

    if (req.file) {
      updateData.image = req.file.path;
    }

    const updated = await Category.findByIdAndUpdate(
      categoryId,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, error: 'Category not found' });
    }

    res.json({ success: true, message: 'Category updated successfully' });
  } catch (err) {
    console.error(err);
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ success: false, error: 'File too large. Max 10MB.' });
    }
    if (err.message && err.message.includes('image')) {
      return res.status(400).json({ success: false, error: 'Invalid file type. Only images allowed.' });
    }
    res.status(500).json({ success: false, error: 'Failed to update category' });
  }
};

// @desc    Delete category permanently
// @route   DELETE /api/admin/categories/:id
// @access  Admin
exports.deleteCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, error: 'Category not found' });
    }

    if (category.image) {
      const imagePath = path.join(__dirname, '..', '..', category.image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    res.json({ success: true, message: 'Category permanently deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Failed to delete category' });
  }
};