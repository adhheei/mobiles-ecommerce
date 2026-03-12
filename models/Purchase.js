const mongoose = require("mongoose");

const purchaseSchema = new mongoose.Schema(
  {
    supplierName: { type: String, required: true },
    totalAmount: { type: Number, required: true },
    totalQuantity: { type: Number, required: true },
    status: { type: String, default: "completed" },
    items: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        productName: { type: String, required: true },
        quantity: { type: Number, required: true },
        unitPrice: { type: Number, required: true },
        total: { type: Number, required: true },
      },
    ],
    purchaseDate: { type: Date, default: Date.now },
  },
  { timestamps: true, collection: "purchases" }
);

module.exports = mongoose.model("Purchase", purchaseSchema);
