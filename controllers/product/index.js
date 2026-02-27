const getAllProducts = require("./getAllProducts");
const getPublicProducts = require("./getPublicProducts");
const getProductById = require("./getProductById");
const addProduct = require("./addProduct");
const updateProduct = require("./updateProduct");
const deleteProduct = require("./deleteProduct");
const { getCategoriesForDropdown, getCategoriesWithCounts, getUniqueBrands } = require("./filterHelpers");

module.exports = {
    getAllProducts,
    getPublicProducts,
    getProductById,
    addProduct,
    updateProduct,
    deleteProduct,
    getCategoriesForDropdown,
    getCategoriesWithCounts,
    getUniqueBrands
};