const express = require("express");
const router = express.Router();
const { isAdmin } = require("../../middleware/authMiddleware");
const category = require("../../controllers/category");
const { single: uploadCategory } = require("../../middleware/upload");

// '/'  means '/api/admin/categories'
router.get("/public", category.getAllCategories);
router.get("/", isAdmin, category.getAllCategories);
router.get("/:id", isAdmin, category.getCategoryById);
router.post("/", isAdmin, uploadCategory, category.createCategory);
router.put("/:id", isAdmin, uploadCategory, category.updateCategory);
router.delete("/:id", isAdmin, category.deleteCategory);

module.exports = router;
