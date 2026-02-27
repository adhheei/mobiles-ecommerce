const placeOrder = require("./placeOrder");
const downloadInvoice = require("./downloadInvoice");
const getMyOrders = require("./getMyOrders");
const getOrderDetails = require("./getOrderDetails");
const cancelOrder = require("./cancelOrder");
const { getAdminOrderDetails, updateOrderStatus } = require("./adminOrderController");
const requestReturn = require("./requestReturn");
const handleReturnRequest = require("./returnHandler");

module.exports = {
    placeOrder,
    downloadInvoice,
    getMyOrders,
    getOrderDetails,
    cancelOrder,
    getAdminOrderDetails,
    updateOrderStatus,
    requestReturn,
    handleReturnRequest
};