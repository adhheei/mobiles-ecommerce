const mongoose = require("mongoose");

const offerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String },
    discountPercentage: { type: Number, required: true, min: 0, max: 100 },
    offerType: {
      type: String,
      enum: ["Product", "Category"],
      required: true,
    },
    // Reference to either a Product or Category
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "offerType",
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Offer", offerSchema);
