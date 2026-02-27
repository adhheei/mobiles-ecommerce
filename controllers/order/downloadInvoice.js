const Order = require("../../models/Order");
const PDFDocument = require("pdfkit");

const downloadInvoice = async (req, res) => {
    try {
        const { orderId } = req.params;
        const order = await Order.findById(orderId);
        if (!order) return res.status(404).json({ success: false, message: "Order not found" });

        const doc = new PDFDocument({ margin: 50 });
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename=Invoice_${order.orderId}.pdf`);

        doc.pipe(res);

        // Header
        doc.fillColor("#444444").fontSize(20).text("JINSA MOBILES", 50, 57);
        doc.fontSize(10).text("Order Invoice", 200, 65, { align: "right" });
        doc.moveTo(50, 80).lineTo(550, 80).stroke();

        // Info
        doc.fillColor("#000000").fontSize(12).text(`Order ID: ${order.orderId}`, 50, 100);
        doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`, 50, 115);
        doc.text(`Status: ${order.orderStatus}`, 50, 130);

        // Shipping
        doc.text("Shipping Address:", 300, 100);
        doc.fontSize(10).text(`${order.shippingAddress.fullName}`, 300, 115);
        doc.text(`${order.shippingAddress.street}`, 300, 125);
        doc.text(`${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.pincode}`, 300, 135);

        // Table Header
        const tableTop = 200;
        doc.font("Helvetica-Bold").fontSize(10);
        doc.text("Product Name", 50, tableTop);
        doc.text("Quantity", 300, tableTop, { width: 50, align: "right" });
        doc.text("Price", 380, tableTop, { width: 70, align: "right" });
        doc.text("Total", 480, tableTop, { width: 70, align: "right" });
        doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

        // List Items
        let currentY = tableTop + 30;
        doc.font("Helvetica").fontSize(10);
        order.items.forEach((item) => {
            doc.text(item.name, 50, currentY, { width: 230 });
            doc.text(item.quantity.toString(), 300, currentY, { width: 50, align: "right" });
            doc.text(`Rs. ${item.price.toLocaleString()}`, 380, currentY, { width: 70, align: "right" });
            doc.text(`Rs. ${(item.price * item.quantity).toLocaleString()}`, 480, currentY, { width: 70, align: "right" });
            currentY += 25;
        });

        // Totals
        const footerTop = Math.max(currentY + 20, 400);
        doc.moveTo(350, footerTop).lineTo(550, footerTop).stroke();
        doc.fontSize(10).text("Subtotal:", 350, footerTop + 10);
        doc.text(`Rs. ${order.totals.subtotal.toLocaleString()}`, 480, footerTop + 10, { align: "right" });
        doc.text("Discount:", 350, footerTop + 25);
        doc.text(`- Rs. ${order.totals.couponDiscount.toLocaleString()}`, 480, footerTop + 25, { align: "right" });
        doc.font("Helvetica-Bold").fontSize(12).text("Grand Total:", 350, footerTop + 45);
        doc.text(`Rs. ${order.totals.totalAmount.toLocaleString()}`, 480, footerTop + 45, { align: "right" });

        doc.end();
    } catch (error) {
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

module.exports = downloadInvoice;