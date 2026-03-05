const User = require('../../models/User');
const bcrypt = require('bcryptjs');

const changeAdminPassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ success: false, message: 'All fields are required' });
        }

        const admin = await User.findById(req.admin._id);
        if (!admin) return res.status(404).json({ success: false, message: 'Admin not found' });

        const isMatch = await bcrypt.compare(currentPassword, admin.password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'Current password is incorrect' });
        }

        // Assign plain password — the User model's pre-save hook will hash it automatically
        admin.password = newPassword;
        await admin.save();

        res.json({ success: true, message: 'Password updated successfully' });
    } catch (err) {
        console.error('Change Admin Password Error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
};

module.exports = changeAdminPassword;
