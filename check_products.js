const mongoose = require('mongoose');
const Product = require('./models/Product');
const path = require('path');
require('dotenv').config();

// Connect to MongoDB
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/jinsa_mobiles');
        console.log('MongoDB Connected');

        const products = await Product.find({});
        console.log(`Found ${products.length} products.`);

        if (products.length > 0) {
            console.log('Sample Product:', JSON.stringify(products[0], null, 2));

            // Check for isDeleted field
            const hasIsDeleted = products.some(p => p.toObject().hasOwnProperty('isDeleted'));
            console.log(`Has 'isDeleted' field: ${hasIsDeleted}`);
        }

    } catch (err) {
        console.error(err);
    } finally {
        mongoose.connection.close();
    }
};

connectDB();
