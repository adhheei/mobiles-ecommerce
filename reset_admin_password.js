const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const resetPassword = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const email = 'admin@gmail.com';
        const newPassword = 'password123';

        const user = await User.findOne({ email });

        if (!user) {
            console.log('Admin user not found!');
            process.exit(1);
        }

        // Set plaintext password. The pre-save hook in User model will hash it.
        user.password = newPassword;
        await user.save();

        console.log(`Password for ${email} has been reset to: ${newPassword}`);
        console.log('The User model pre-save hook has hashed this password correctly.');

        process.exit(0);
    } catch (error) {
        console.error('Password reset failed:', error);
        process.exit(1);
    }
};

resetPassword();
