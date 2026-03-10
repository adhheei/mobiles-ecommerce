const Product = require("../../models/Product");

const updateProductPrices = async (offerType, targetId, discountPercentage) => {
  if (offerType === "Category") {
    const products = await Product.find({ category: targetId });
    const updatePromises = products.map((product) => {
      product.offerPrice = Math.round(
        product.actualPrice * (1 - discountPercentage / 100),
      );
      return product.save();
    });
    await Promise.all(updatePromises);
  } else {
    const product = await Product.findById(targetId);
    if (product) {
      product.offerPrice = Math.round(
        product.actualPrice * (1 - discountPercentage / 100),
      );
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
