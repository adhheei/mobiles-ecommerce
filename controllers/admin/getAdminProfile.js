const User = require('../../models/User');

const getAdminProfile = async (req, res) => {
    try {
        const admin = await User.findById(req.admin._id).select('-password');
        if (!admin) return res.status(404).json({ success: false, message: 'Admin not found' });

        res.json({ success: true, admin });
    } catch (err) {
        console.error('Get Admin Profile Error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
};

const updateAdminProfile = async (req, res) => {
    try {
        const { firstName, lastName, email } = req.body;
        const admin = await User.findByIdAndUpdate(
            req.admin._id,
            { firstName, lastName, email },
            { new: true }
        ).select('-password');
        if (!admin) return res.status(404).json({ success: false, message: 'Admin not found' });

        res.json({ success: true, admin, message: 'Profile updated successfully' });
    } catch (err) {
        console.error('Update Admin Profile Error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
};

module.exports = { getAdminProfile, updateAdminProfile };
