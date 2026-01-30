const mongoose = require('mongoose');
const Admin = require('./models/Admin');
const User = require('./models/User');
require('dotenv').config();

const migrateAdmins = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const admins = await Admin.find();
        console.log(`Found ${admins.length} admins to migrate.`);

        for (const admin of admins) {
            const existingUser = await User.findOne({ email: admin.email });
            if (existingUser) {
                console.log(`User with email ${admin.email} already exists. Updating role to admin.`);
                existingUser.role = 'admin';
                await existingUser.save();
            } else {
                console.log(`Creating new user for admin ${admin.email}.`);
                const newUser = new User({
                    firstName: 'Admin',
                    lastName: 'User',
                    email: admin.email,
                    phone: `0000000000-${Date.now()}`, // Temporary unique phone
                    password: admin.password, // Init with same hash, assuming compatible bcrypt
                    role: 'admin',
                    isVerified: true
                });
                await newUser.save();
            }
        }

        console.log('Migration complete.');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
};

migrateAdmins();
