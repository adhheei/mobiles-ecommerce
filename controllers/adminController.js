const Product = require('../models/productModel'); 

exports.addProduct = async (req, res) => {
    try {
        const { name, price, stock, category } = req.body;

        // Log the body to see what reached the server
        console.log("Received Body:", req.body);

        const newProduct = new Product({
            name,
            price: parseFloat(price),
            stock: parseInt(stock),
            category,
            mainImage: req.files['mainImage'] ? req.files['mainImage'][0].filename : null,
            // ... rest of your fields
        });

        await newProduct.save();
        res.status(200).json({ success: true });

    } catch (error) {
        console.error("Mongoose Error:", error.message); // This prints in your terminal
        res.status(500).json({ 
            success: false, 
            message: "Database Error: " + error.message // This shows in your SweetAlert
        });
    }
};


exports.listProducts = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 10; // Forced maximum of 10 products per page
        const skip = (page - 1) * limit;

        // --- FILTER LOGIC ---
        let query = {};
        
        // 1. Search Logic (Case-insensitive search on name)
        if (req.query.search) {
            query.name = { $regex: req.query.search, $options: 'i' };
        }

        // 2. Category Logic
        if (req.query.category && req.query.category !== 'all') {
            query.category = req.query.category;
        }

        // --- SORT LOGIC ---
        let sortOptions = { createdAt: -1 }; // Default: Newest
        if (req.query.sort === 'price-high') sortOptions = { price: -1 };
        if (req.query.sort === 'price-low') sortOptions = { price: 1 };

        const totalProducts = await Product.countDocuments(query);
        const products = await Product.find(query)
            .sort(sortOptions)
            .skip(skip)
            .limit(limit);

        res.status(200).json({
            success: true,
            products,
            totalProducts,
            totalPages: Math.ceil(totalProducts / limit),
            currentPage: page
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.deleteProduct = async (req, res) => {
    try {
        const productId = req.params.id; // Extracts ID from URL
        const deletedProduct = await Product.findByIdAndDelete(productId);

        if (!deletedProduct) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        res.status(200).json({ success: true, message: "Product deleted successfully" });
    } catch (error) {
        console.error("Delete Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};


// Fetch a single product by ID to fill the Edit Form
exports.getSingleProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ success: false, message: "Not found" });
        res.status(200).json({ success: true, product });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Update the product in MongoDB
exports.updateProduct = async (req, res) => {
    try {
        const productId = req.params.id;
        const updates = { ...req.body };

        // Handle new image if uploaded
        if (req.files && req.files['mainImage']) {
            updates.mainImage = req.files['mainImage'][0].filename;
        }

        const updatedProduct = await Product.findByIdAndUpdate(productId, updates, { new: true });
        res.status(200).json({ success: true, message: "Product updated!" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};