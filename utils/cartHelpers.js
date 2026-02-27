// utils/cartHelpers.js
const formatImageUrl = (filePath) => {
  if (!filePath) return "https://placehold.co/100x120/f0f0f0/333?text=No+Image";
  return "/" + filePath.replace(/\\/g, "/").replace(/^public\//, "").replace(/^\//, "");
};

const formatCart = (cart) => {
  let subtotal = 0;
  let totalMrp = 0;

  const items = cart.items.map((item) => {
    const product = item.productId;
    if (!product) return null;

    const price = product.offerPrice || product.price || 0;
    const mrp = product.actualPrice || product.price || 0;
    const lineTotal = price * item.quantity;

    subtotal += lineTotal;
    totalMrp += mrp * item.quantity;

    return {
      productId: product._id,
      name: product.productName || product.name,
      image: formatImageUrl(product.mainImage),
      color: product.color,
      price,
      mrp,
      quantity: item.quantity,
      stock: product.stock,
      lineTotal,
    };
  }).filter(Boolean);

  return {
    items,
    subtotal,
    totalMrp,
    discount: totalMrp - subtotal,
    totalAmount: subtotal,
  };
};

module.exports = { formatCart, formatImageUrl };