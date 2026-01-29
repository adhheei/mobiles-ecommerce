const mongoose = require('mongoose');
const Admin = require('./models/Admin');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        console.log('Connected to MongoDB');
        const result = await Admin.updateMany(
            { role: { $exists: false } },
            { $set: { role: 'admin' } }
        );
        console.log(`Updated ${result.modifiedCount} admins with default role.`);
        process.exit(0);
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
