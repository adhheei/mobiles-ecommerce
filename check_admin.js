const mongoose = require('mongoose');
const Admin = require('./models/Admin');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        console.log('Connected to MongoDB');
        const count = await Admin.countDocuments();
        console.log(`Admin count: ${count}`);
        if (count > 0) {
            const admins = await Admin.find().select('email');
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
