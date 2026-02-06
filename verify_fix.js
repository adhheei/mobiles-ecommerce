const mongoose = require('mongoose');
const Product = require('./models/Product');
const Category = require('./models/Category'); // Need Category schema for population
require('dotenv').config();

const verifyFix = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/jinsa_mobiles');
        console.log('MongoDB Connected');

        const query = { status: 'active', visibility: 'public' };

        // Simulate population and sort
        const products = await Product.find(query)
            .populate('category', '_id name')
            .sort({ createdAt: -1 }) // Default sort
            .limit(5);

        console.log(`Found ${products.length} products with new query.`);

        if (products.length > 0) {
            products.forEach(p => {
                console.log(`- Product: ${p.name}, Price: ${p.offerPrice}, Category: ${p.category ? p.category.name : 'None'}`);
            });
            console.log("SUCCESS: Products are being fetched with the new query.");
        } else {
            console.log("WARNING: No products found. Check if products are actually 'active' and 'public'.");

            // Debugging: Check why
            const allProducts = await Product.find({});
            console.log(`Total products depends on DB: ${allProducts.length}`);
            if (allProducts.length > 0) {
                console.log("Sample product status:", allProducts[0].status);
                console.log("Sample product visibility:", allProducts[0].visibility);
            }
        }

    } catch (err) {
        console.error("Verification Failed:", err);
    } finally {
        mongoose.connection.close();
    }
};

verifyFix();
