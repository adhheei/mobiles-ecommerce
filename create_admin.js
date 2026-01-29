const mongoose = require('mongoose');
const Admin = require('./models/Admin');
const bcrypt = require('bcryptjs');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        console.log('Connected to MongoDB');

        const email = 'admin@example.com';
        const password = 'password123';

        // Check if exists
        const exists = await Admin.findOne({ email });
        if (exists) {
            console.log('Admin already exists.');
            if (!exists.role) {
                exists.role = 'admin';
                await exists.save();
                console.log('Role updated for existing admin.');
            }
        } else {
            // Create new
            const hashedPassword = await bcrypt.hash(password, 10);
            // Note: pre-save hook also hashes, so we pass raw password if using create() 
            // BUT my model has a pre-save hook that hashes ONLY if modified.
            // Let's pass the raw password and let the hook handle it, 
            // OR pass hashed and ensure hook doesn't double hash?
            // My hook: if (!this.isModified('password')) return;
            // If I pass it to create(), it IS modified.
            // So I should pass raw password.

            await Admin.create({
                email,
                password: password,
                role: 'admin'
            });
            console.log(`Admin created: ${email} / ${password}`);
        }

        process.exit(0);
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
