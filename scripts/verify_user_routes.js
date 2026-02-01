try {
    const userRoutes = require('../routes/userRoutes');
    console.log('SUCCESS: userRoutes loaded without ReferenceError.');
} catch (error) {
    console.error('CRASH: Could not load userRoutes:', error);
    process.exit(1);
}
