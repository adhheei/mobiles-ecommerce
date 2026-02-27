const { getWallet, applyWallet } = require("./walletController");
const { adminGetWallet, adminUpdateWallet } = require("./adminWalletController");

module.exports = {
    getWallet,
    applyWallet,
    adminGetWallet,
    adminUpdateWallet
};