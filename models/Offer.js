const mongoose = require("mongoose");

const offerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slogan: { type: String }, // For the subtitle/slogan
    description: { type: String },
    discountValue: { type: Number, required: true, min: 0 },
    discountType: {
      type: String,
      enum: ["percentage", "fixed"],
      default: "percentage"
    },
    offerType: {
      type: String,
      enum: ["Product", "Category"],
      required: true,
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "offerType",
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
    minPurchaseAmount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true, collection: "offers" },
);

module.exports = mongoose.model("Offer", offerSchema);
