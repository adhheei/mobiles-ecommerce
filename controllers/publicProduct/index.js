const getPublicProducts = require("./getPublicProducts");
const { getCategoriesWithCounts, getAllCategories } = require("./getCategories");
const getBrandsWithCounts = require("./getBrands"); // Similar to getCategories structure
const getSearchSuggestions = require("./searchSuggestions"); // Similar to getSuggestions structure
const getSuggestions = require("./getSuggestions");

module.exports = {
    getPublicProducts,
    getCategoriesWithCounts,
    getAllCategories,
    getBrandsWithCounts,
    getSearchSuggestions,
    getSuggestions,
};