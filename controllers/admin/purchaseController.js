const Purchase = require("../../models/Purchase");
const Product = require("../../models/Product");

const addPurchase = async (req, res) => {
  try {
    const { supplierName, purchaseDate, items, totalAmount, totalQuantity, status } = req.body;

    const itemsToSave = [];

    // Process each item
    for (const item of items) {
      // Find exact product match by name (case-insensitive)
      const productNameRegex = new RegExp(`^${item.productName}$`, "i");
      let product = await Product.findOne({ name: productNameRegex });

      if (!product) {
        return res
          .status(404)
          .json({ success: false, message: `Product not found: ${item.productName}` });
      }

      // Increment the stock
      product.stock = (product.stock || 0) + parseInt(item.quantity);
      await product.save();

      itemsToSave.push({
        productId: product._id,
        productName: product.name,
        quantity: parseInt(item.quantity),
        unitPrice: parseFloat(item.unitPrice),
        total: parseFloat(item.total),
      });
    }

    // Save the global financial record
    const newPurchase = new Purchase({
      supplierName,
      purchaseDate: purchaseDate ? new Date(purchaseDate) : Date.now(),
      totalAmount,
      totalQuantity,
      status: status || "completed",
      items: itemsToSave,
    });

    await newPurchase.save();

    res.status(200).json({
      success: true,
      message: "Purchase order created and stock updated successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getPurchaseReport = async (req, res) => {
  try {
    const reports = await Purchase.find()
      .populate("items.productId", "name sku")
      .sort({ createdAt: -1 });

    // Format reports for the frontend (add shorthand id)
    const formattedReports = reports.map(r => ({
      ...r.toObject(),
      id: "PUR-" + r._id.toString().substring(18, 24).toUpperCase()
    }));

    res.status(200).json({ success: true, reports: formattedReports });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { addPurchase, getPurchaseReport };
