const Razorpay = require("razorpay");

// 1. INITIALIZE AT TOP LEVEL
// This ensures the object exists as soon as the file is loaded
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/**
 * @desc    Create Razorpay order for frontend checkout
 * @route   POST /api/razorpay/create-order
 * @access  Private
 */
const createOrder = async (req, res) => {
    try {
        const { amount } = req.body;

        // Explicit check for invalid amounts
        if (
            amount === undefined ||
            amount === null ||
            isNaN(amount) ||
            amount <= 0
        ) {
            console.error("Backend received invalid amount:", amount);
            return res.status(400).json({
                success: false,
                message: "Invalid amount: Payment cannot be processed.",
            });
        }

        const options = {
            amount: Math.round(Number(amount) * 100), // Razorpay needs Paise (INR * 100)
            currency: "INR",
            receipt: `receipt_${Date.now()}`,
        };

        // 2. USE THE PRE-INITIALIZED OBJECT
        const order = await razorpay.orders.create(options);

        res.status(200).json({
            success: true,
            order,
            key_id: process.env.RAZORPAY_KEY_ID,
        });
    } catch (error) {
        console.error("Razorpay Order Creation Error:", error);
        res.status(500).json({
            success: false,
            message: "Backend failed to create Razorpay order: " + error.message,
        });
    }
};

module.exports = createOrder;