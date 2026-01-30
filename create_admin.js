const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcryptjs');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        console.log('Connected to MongoDB');

        const email = 'admin@gmail.com';
        const password = 'password123';

        // Check if exists
        const exists = await User.findOne({ email });
        if (exists) {
            console.log('User with this email already exists.');
            if (exists.role !== 'admin') {
                exists.role = 'admin';
                await exists.save();
                console.log('Role updated to admin for existing user.');
            } else {
                console.log('User is already an admin.');
            }
        } else {
            // Create new
            const hashedPassword = await bcrypt.hash(password, 10);

            await User.create({
                firstName: 'Admin',
                lastName: 'User',
                email,
                phone: '0000000000', // Default dummy phone
                password: password, // Pre-save hook will hash it if we pass raw, but let's be consistent with User model usage
                role: 'admin',
                isVerified: true
            });
            console.log(`Admin user created: ${email} / ${password}`);
        }

        process.exit(0);
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
