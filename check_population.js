const mongoose = require('mongoose');
require('dotenv').config();

const Product = require('./models/Product');
const Category = require('./models/Category');

// Connect to MongoDB
const dbURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/jinsa_mobiles';
mongoose.connect(dbURI)
    .then(() => {
        console.log('MongoDB Connected');
        checkProductCategories();
    })
    .catch(err => {
        console.error('Connection error:', err);
        process.exit(1);
    });

async function checkProductCategories() {
    try {
        const products = await Product.find({}).populate('category');
        console.log('Checking product categories:');
        products.forEach(p => {
            console.log(`Product: ${p.name}`);
            console.log(`  Category Field:`, p.category);
            if (p.category) {
                console.log(`  Category Name: ${p.category.name}`);
            } else {
                console.log(`  Category is null/undefined`);
            }
        });

        process.exit(0);
    } catch (error) {
        console.error('Error checking:', error);
        process.exit(1);
    }
}
