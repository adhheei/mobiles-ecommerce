require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const NEW_PASSWORD = 'password123';

async function resetAdminPassword() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        const admin = await User.findOne({ role: 'admin' });
        if (!admin) { console.error('❌ No admin user found.'); process.exit(1); }

        // ✅ Assign plain password — pre-save hook will hash it ONCE
        admin.password = NEW_PASSWORD;
        await admin.save();

        console.log(`✅ Password reset successfully! Email: ${admin.email} | Password: ${NEW_PASSWORD}`);
    } catch (err) {
        console.error('❌ Error:', err.message);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

resetAdminPassword();
