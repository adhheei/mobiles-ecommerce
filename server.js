const express = require('express');
const path = require('path');
const app = express();
const cors = require('cors'); // 1. Import CORS
const mongoose = require('mongoose');
const helmet = require('helmet');
const adminRoutes = require('./routes/adminRoutes');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("Connected to MongoDB..."))
.catch(err => console.error("Could not connect to MongoDB", err));

// 1. Middleware to handle data
app.use(express.json());
app.use(helmet({ contentSecurityPolicy: false })); // Disables the strict policy for local development
app.use(cors()); // 2. Enable CORS for all requests
app.use(express.urlencoded({ extended: true }));
app.use('/admin', adminRoutes);

// 2. Serve your static HTML files
app.use(express.static(path.join(__dirname, 'public')));

// 3. Simple test route
app.get('/api/test', (req, res) => {
    res.json({ message: "Backend is connected!" });
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));





