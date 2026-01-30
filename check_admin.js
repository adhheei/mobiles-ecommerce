const mongoose = require('mongoose');
const User = require('./models/User'); // Updated to User model
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        console.log('Connected to MongoDB');
        // Count users with role 'admin'
        const count = await User.countDocuments({ role: 'admin' });
        console.log(`Admin count: ${count}`);
        if (count > 0) {
            const admins = await User.find({ role: 'admin' }).select('email firstName role');
            console.log('Admins:', admins);
        } else {
            console.log('No admins found! You might need to seed the database or register an admin.');
        }
        process.exit(0);
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
