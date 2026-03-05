const Purchase = require("../../models/Purchase");
const Product = require("../../models/Product");

const updatePurchase = async (req, res) => {
  try {
    const { supplierName, purchaseDate, items, totalAmount, totalQuantity } = req.body;
    const purchaseFriendlyId = req.params.id;

    const existingPurchase = await Purchase.findById(req.params.id);
    if (!existingPurchase) {
      return res.status(404).json({ success: false, message: "Purchase record not found" });
    }

    // 1. Revert Old Stock
    for (const oldItem of existingPurchase.items) {
      await Product.findByIdAndUpdate(oldItem.productId, {
        $inc: { stock: -oldItem.quantity },
      });
    }

    const itemsToSave = [];

    // 2. Apply New Stock and Populate productId
    for (const newItem of items) {
      const productNameRegex = new RegExp(`^${newItem.productName}$`, "i");
      const product = await Product.findOne({ name: productNameRegex });

      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product not found: ${newItem.productName}`,
        });
      }

      // Increment the stock
      product.stock = (product.stock || 0) + parseInt(newItem.quantity);
      await product.save();

      itemsToSave.push({
        productId: product._id,
        productName: product.name,
        quantity: parseInt(newItem.quantity),
        unitPrice: parseFloat(newItem.unitPrice),
        total: parseFloat(newItem.total),
      });
    }

    // 3. Update the Purchase document
    existingPurchase.supplierName = supplierName;
    existingPurchase.purchaseDate = purchaseDate
      ? new Date(purchaseDate)
      : existingPurchase.purchaseDate;
    existingPurchase.items = itemsToSave; // Use items with productIds
    existingPurchase.totalAmount = totalAmount;
    existingPurchase.totalQuantity = totalQuantity;

    await existingPurchase.save();

    res.status(200).json({
      success: true,
      message: "Purchase order and stock levels updated successfully",
    });
  } catch (error) {
    console.error("Update Purchase Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  updatePurchase
};