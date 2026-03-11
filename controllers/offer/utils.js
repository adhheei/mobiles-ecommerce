const Product = require("../../models/Product");

const updateProductPrices = async (offerType, targetId, discountValue, discountType = "percentage") => {
  const calculateOfferPrice = (actualPrice) => {
    if (discountType === "fixed") {
      return Math.max(0, actualPrice - discountValue);
    }
    // Default to percentage
    return Math.round(actualPrice * (1 - discountValue / 100));
  };

  if (offerType === "Category") {
    const products = await Product.find({ category: targetId });
    const updatePromises = products.map((product) => {
      product.offerPrice = calculateOfferPrice(product.actualPrice);
      return product.save();
    });
    await Promise.all(updatePromises);
  } else {
    const product = await Product.findById(targetId);
    if (product) {
      product.offerPrice = calculateOfferPrice(product.actualPrice);
      await product.save();
    }
  }
};

const resetProductPrices = async (offerType, targetId) => {
  if (offerType === "Category") {
    const products = await Product.find({ category: targetId });
    const updatePromises = products.map((product) => {
      product.offerPrice = product.actualPrice;
      return product.save();
    });
    await Promise.all(updatePromises);
  } else {
    const product = await Product.findById(targetId);
    if (product) {
      product.offerPrice = product.actualPrice;
      await product.save();
    }
  }
};

module.exports = { updateProductPrices, resetProductPrices };
