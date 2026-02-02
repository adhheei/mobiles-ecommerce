const Transaction = require('../models/Transaction');

exports.getTransactions = async (req, res) => {
    try {
        // seedTransactions removed

        const { page = 1, limit = 10, search, status, range, fromDate, toDate } = req.query;
        const query = {};

        // Search
        if (search) {
            query.$or = [
                { transactionId: { $regex: search, $options: 'i' } },
                { orderId: { $regex: search, $options: 'i' } },
                { 'user.email': { $regex: search, $options: 'i' } },
                { 'user.name': { $regex: search, $options: 'i' } }
            ];
        }

        // Filter by Status
        if (status && status !== 'All') {
            query.status = status;
        }

        // Filter by Date Range
        if (range || (fromDate && toDate)) {
            const now = new Date();
            let start, end = new Date(now);

            if (range === 'today') {
                start = new Date(now.setHours(0, 0, 0, 0));
            } else if (range === '7days') {
                start = new Date(now.setDate(now.getDate() - 7));
            } else if (range === '30days') {
                start = new Date(now.setDate(now.getDate() - 30));
            } else if (range === 'month') {
                start = new Date(now.getFullYear(), now.getMonth(), 1);
            } else if (fromDate && toDate) {
                start = new Date(fromDate);
                end = new Date(toDate);
                end.setHours(23, 59, 59, 999);
            }

            if (start) {
                query.date = { $gte: start, $lte: end };
            }
        }

        const transactions = await Transaction.find(query)
            .sort({ date: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await Transaction.countDocuments(query);

        res.json({
            transactions,
            totalPages: Math.ceil(total / limit),
            currentPage: parseInt(page),
            total
        });

    } catch (error) {
        console.error("Error fetching transactions:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

exports.downloadTransactions = async (req, res) => {
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

        if (range || (fromDate && toDate)) {
            const now = new Date();
            let start, end = new Date(now);

            if (range === 'today') {
                start = new Date(now.setHours(0, 0, 0, 0));
            } else if (range === '7days') {
                start = new Date(now.setDate(now.getDate() - 7));
            } else if (range === '30days') {
                start = new Date(now.setDate(now.getDate() - 30));
            } else if (range === 'month') {
                start = new Date(now.getFullYear(), now.getMonth(), 1);
            } else if (fromDate && toDate) {
                start = new Date(fromDate);
                end = new Date(toDate);
                end.setHours(23, 59, 59, 999);
            }

            if (start) {
                query.date = { $gte: start, $lte: end };
            }
        }

        const transactions = await Transaction.find(query).sort({ date: -1 });

        // Convert to CSV
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
