const createCoupon = require("./createCoupon");
const { getCoupons } = require("./getCoupons");
const getCoupon = require("./getCoupon");
const updateCoupon = require("./updateCoupon");
const deleteCoupon = require("./deleteCoupon");
const getAvailableCoupons = require("./getAvailable");
const applyCoupon = require("./applyCoupon");

module.exports = {
  createCoupon,
  getCoupons,
  getCoupon,
  updateCoupon,
  deleteCoupon,
  getAvailableCoupons,
  applyCoupon,
};
