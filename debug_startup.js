try {
    console.log('Loading User model...');
    require('./models/User');
    console.log('User model loaded.');

    console.log('Loading authController...');
    const authController = require('./controllers/authController');
    console.log('authController loaded. loginAdmin type:', typeof authController.loginAdmin);

    console.log('Loading adminAuthMiddleware...');
    const adminAuthMiddleware = require('./middleware/adminAuthMiddleware');
    console.log('adminAuthMiddleware loaded. protectAdmin type:', typeof adminAuthMiddleware.protectAdmin);

    console.log('Loading adminRoutes...');
    require('./routes/adminRoutes');
    console.log('adminRoutes loaded.');

    console.log('Loading authRoutes...');
    require('./routes/authRoutes');
    console.log('authRoutes loaded.');

    console.log('Loading userRoutes...');
    require('./routes/userRoutes');
    console.log('userRoutes loaded.');

    console.log('Loading contactRoutes...');
    require('./routes/contactRoutes');
    console.log('contactRoutes loaded.');

    console.log('All modules loaded successfully.');
} catch (error) {
    console.error('Debug script failed:', error);
}
