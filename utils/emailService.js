const nodemailer = require("nodemailer");

// Initialize transporter
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

/**
 * @desc    Sends a formatted HTML order confirmation email
 */
const sendOrderConfirmationEmail = async (user, order) => {
    try {
        const itemsHtml = order.items
            .map(
                (item) => `
            <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 10px;">${item.name}</td>
                <td style="padding: 10px; text-align: center;">${item.quantity}</td>
                <td style="padding: 10px; text-align: right;">₹${item.price}</td>
            </tr>
            `
            )
            .join("");

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: user.email,
            subject: `Order Confirmation - ${order.orderId}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                    <h2 style="color: #333; text-align: center;">Thank You for Your Order!</h2>
                    <p>Hi ${user.firstName},</p>
                    <p>Your order <strong>${order.orderId}</strong> has been successfully placed.</p>
                    
                    <h3 style="background: #f4f4f4; padding: 10px; border-radius: 5px;">Order Summary</h3>
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="background: #eee;">
                                <th style="padding: 10px; text-align: left;">Product</th>
                                <th style="padding: 10px; text-align: center;">Qty</th>
                                <th style="padding: 10px; text-align: right;">Price</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${itemsHtml}
                        </tbody>
                    </table>

                    <div style="margin-top: 20px; text-align: right;">
                        <p><strong>Subtotal:</strong> ₹${order.totals.subtotal}</p>
                        <p><strong>Discount:</strong> -₹${order.totals.couponDiscount}</p>
                        <p><strong>Shipping:</strong> ₹${order.totals.shipping}</p>
                        <h3 style="color: #28a745;">Total: ₹${order.totals.totalAmount}</h3>
                    </div>

                    <div style="margin-top: 20px; padding: 15px; background: #f9f9f9; border-radius: 5px;">
                        <h4>Shipping Address:</h4>
                        <p>${order.shippingAddress.fullName}</p>
                        <p>${order.shippingAddress.street}, ${order.shippingAddress.city}</p>
                        <p>${order.shippingAddress.state} - ${order.shippingAddress.pincode}</p>
                        <p>Phone: ${order.shippingAddress.phone}</p>
                    </div>

                    <p style="text-align: center; margin-top: 30px; font-size: 12px; color: #777;">
                        Need help? Contact us at support@jinsamobiles.com
                    </p>
                </div>
            `,
        };

        await transporter.sendMail(mailOptions);
        console.log(`✅ Order confirmation email sent to ${user.email}`);
    } catch (error) {
        console.error("❌ Error sending email:", error);
    }
};

module.exports = { sendOrderConfirmationEmail };