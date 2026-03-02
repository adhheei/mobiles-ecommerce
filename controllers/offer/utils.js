const Product = require("../../models/Product");

const updateProductPrices = async (offerType, targetId, discountPercentage) => {
  if (offerType === "Category") {
    const products = await Product.find({ category: targetId });
    const updatePromises = products.map((product) => {
      product.salePrice = Math.round(
        product.regularPrice * (1 - discountPercentage / 100),
      );
      return product.save();
    });
    await Promise.all(updatePromises);
  } else {
    const product = await Product.findById(targetId);
    if (product) {
      product.salePrice = Math.round(
        product.regularPrice * (1 - discountPercentage / 100),
      );
      await product.save();
    }
  }
};

module.exports = { updateProductPrices };
