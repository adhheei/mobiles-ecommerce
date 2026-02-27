// controllers/address/index.js
const addAddress = require("./addAddress");
const getAddresses = require("./getAddresses");
const getAddress = require("./getAddress");
const updateAddress = require("./updateAddress");
const deleteAddress = require("./deleteAddress");
const setDefaultAddress = require("./setDefaultAddress");

module.exports = {
    addAddress,
    getAddresses,
    getAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
};