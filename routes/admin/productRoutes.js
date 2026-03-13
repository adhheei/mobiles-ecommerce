const express = require("express");
const router = express.Router();
const { isAdmin } = require("../../middleware/authMiddleware");
const product = require("../../controllers/product");
const publicProduct = require("../../controllers/publicProduct");
const { product: uploadProduct } = require("../../middleware/upload");

// These routes will be mounted at /api/admin in adminRoutes.js to preserve paths like /search and /brands
// PUBLIC PRODUCT ROUTES
router.get("/products/categories/public", publicProduct.getAllCategories);
router.get("/products/categories-with-counts", product.getCategoriesWithCounts);
router.get("/products/public", publicProduct.getPublicProducts);
router.get("/search/suggestions", publicProduct.getSearchSuggestions);
router.get("/products/brands-with-counts", publicProduct.getBrandsWithCounts);
router.get("/products/public/:id", product.getProductById);
router.post("/products/suggestions", publicProduct.getSuggestions);

// ADMIN PRODUCT ROUTES
router.get("/products/categories", isAdmin, product.getCategoriesForDropdown);
router.get("/products", isAdmin, product.getAllProducts);
router.post("/products", isAdmin, uploadProduct, product.addProduct);
router.get("/brands", isAdmin, product.getUniqueBrands);
router.get("/products/:id", isAdmin, product.getProductById);
router.put("/products/:id", isAdmin, uploadProduct, product.updateProduct);
router.delete("/products/:id", isAdmin, product.deleteProduct);

module.exports = router;
