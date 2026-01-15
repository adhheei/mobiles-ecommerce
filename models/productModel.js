const mongoose = require("mongoose");
const Product = require("../models/productModel");

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true },
  stock: { type: Number, required: true },
  category: { type: String, required: true },
  mainImage: { type: String },
  galleryImages: [String],
  status: { type: String, default: "active" },
});

// 2. Use the EXACT same name here
module.exports = mongoose.model("Product", productSchema);
