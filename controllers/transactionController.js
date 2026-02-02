const Transaction = require('../models/Transaction');

// Helper to seed data if empty
const seedTransactions = async () => {
    const count = await Transaction.countDocuments();
    if (count === 0) {
        const dummyData = [
            { transactionId: 'TXN-1001', orderId: 'ORD-5001', user: { name: 'John Doe', email: 'john@example.com' }, paymentMethod: 'Card', amount: 120.50, status: 'Success', date: new Date('2023-10-25') },
            { transactionId: 'TXN-1002', orderId: 'ORD-5002', user: { name: 'Jane Smith', email: 'jane@example.com' }, paymentMethod: 'UPI', amount: 45.00, status: 'Success', date: new Date('2023-10-24') },
            { transactionId: 'TXN-1003', orderId: 'ORD-5003', user: { name: 'Mike Ross', email: 'mike@example.com' }, paymentMethod: 'COD', amount: 200.00, status: 'Pending', date: new Date('2023-10-23') },
            { transactionId: 'TXN-1004', orderId: 'ORD-5004', user: { name: 'Rachel Green', email: 'rachel@example.com' }, paymentMethod: 'Wallet', amount: 15.00, status: 'Failed', date: new Date('2023-10-22') },
            { transactionId: 'TXN-1005', orderId: 'ORD-5005', user: { name: 'Harvey Specter', email: 'harvey@example.com' }, paymentMethod: 'Card', amount: 500.00, status: 'Success', date: new Date() },
            { transactionId: 'TXN-1006', orderId: 'ORD-5006', user: { name: 'Louis Litt', email: 'louis@example.com' }, paymentMethod: 'UPI', amount: 80.00, status: 'Pending', date: new Date() },
            { transactionId: 'TXN-1007', orderId: 'ORD-5007', user: { name: 'Donna Paulsen', email: 'donna@example.com' }, paymentMethod: 'Card', amount: 320.00, status: 'Success', date: new Date() }
        ];
        await Transaction.insertMany(dummyData);
        console.log("Seeded dummy transactions");
    }
};

exports.getTransactions = async (req, res) => {
    try {
        await seedTransactions(); // Ensure data exists

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
            let start, end = now;

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
            let start, end = now;

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
