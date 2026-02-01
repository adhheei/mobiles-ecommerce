try {
    const userController = require('../controllers/userController');
    if (typeof userController.changePassword === 'function') {
        console.log('SUCCESS: changePassword is exported correctly.');
    } else {
        console.error('FAILURE: changePassword is NOT exported.');
        process.exit(1);
    }
} catch (error) {
    console.error('CRASH: Could not load userController:', error);
    process.exit(1);
}
