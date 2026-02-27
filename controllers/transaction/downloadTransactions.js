const Transaction = require('../../models/Transaction');
const { buildDateQuery } = require('./filterHelper');

const downloadTransactions = async (req, res) => {
    try {
        const { search, status, range, fromDate, toDate } = req.query;
        const query = {};

        if (search) {
            query.$or = [
                { transactionId: { $regex: search, $options: 'i' } },
                { orderId: { $regex: search, $options: 'i' } },
                { 'user.email': { $regex: search, $options: 'i' } }
            ];
        }

        if (status && status !== 'All') {
            query.status = status;
        }

        const dateQuery = buildDateQuery(range, fromDate, toDate);
        if (dateQuery) query.date = dateQuery;

        const transactions = await Transaction.find(query).sort({ date: -1 });

        const fields = ['Transaction ID', 'Order ID', 'User Name', 'User Email', 'Payment Method', 'Amount', 'Status', 'Date'];
        let csv = fields.join(',') + '\n';

        transactions.forEach(txn => {
            const row = [
                txn.transactionId,
                txn.orderId,
                txn.user.name,
                txn.user.email,
                txn.paymentMethod,
                txn.amount,
                txn.status,
                new Date(txn.date).toLocaleDateString()
            ];
            csv += row.join(',') + '\n';
        });

        res.header('Content-Type', 'text/csv');
        res.attachment('transactions.csv');
        res.send(csv);
    } catch (error) {
        console.error("Error downloading transactions:", error);
        res.status(500).json({ error: "Download failed" });
    }
};

module.exports = downloadTransactions;