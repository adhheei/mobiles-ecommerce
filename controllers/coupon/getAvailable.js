const Coupon = require("../../models/Coupon");

/**
 * @desc    Get all coupons available to a specific user (filters out expired/over-limit)
 * @route   GET /api/user/coupons
 * @access  Private/User
 */
const getAvailableCoupons = async (req, res) => {
    try {
        const userId = req.user._id.toString();

        // 1. Fetch active coupons sorted by soonest to expire
        const coupons = await Coupon.find({ isActive: true })
            .sort({ endDate: 1 })
            .lean();

        // 2. Process and mark coupons based on user usage
        const processedCoupons = coupons.map((coupon) => {
            // Check how many times THIS user has used THIS coupon
            const usageCount = coupon.userUsage ? (coupon.userUsage[userId] || 0) : 0;
            
            // Logic Flags
            const isRedeemed = coupon.perUserLimit && usageCount >= coupon.perUserLimit;
            const isExpired = new Date(coupon.endDate) < new Date();
            const isStarted = new Date(coupon.startDate) <= new Date();

            return {
                ...coupon,
                isUsed: isRedeemed,
                isExpired: isExpired,
                isAvailable: isStarted && !isExpired && !isRedeemed,
                remainingUses: coupon.perUserLimit ? (coupon.perUserLimit - usageCount) : 'Unlimited'
            };
        });

        res.status(200).json({
            success: true,
            count: processedCoupons.length,
            data: processedCoupons,
        });
    } catch (error) {
        console.error("Get User Coupons Error:", error);
        res.status(500).json({ success: false, message: "Server Error while fetching available coupons" });
    }
};

module.exports = getAvailableCoupons;