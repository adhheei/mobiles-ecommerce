// models/Product.js
const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: 100
  },
  brand: {
    type: String,
    default: 'Generic',
    trim: true
  },
  description: {
    type: String,
    default: '',
    maxlength: 1000
  },
  sku: {
    type: String,
    unique: true,
    trim: true,
    sparse: true // 👈 Prevents duplicate null/empty errors
  },
  actualPrice: {
    type: Number,
    required: true,
    min: 0
  },
  offerPrice: {
    type: Number,
    required: true,
    min: 0
  },
  stock: {
    type: Number,
    required: true,
    min: 0
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  mainImage: {
    type: String,
    default: ''
  },
  gallery: [{
    type: String
  }],
  status: {
    type: String,
    enum: ['active', 'draft', 'outofstock'],
    default: 'active'
  },
  visibility: {
    type: String,
    enum: ['public', 'hidden'],
    default: 'public'
  },
  publishDate: {
    type: Date
  },
  tags: [{
    type: String,
    trim: true,
    validate: {
      validator: function (v) {
        return v.trim().length > 0;
      },
      message: 'Tags cannot be empty'
    }
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Product', productSchema);