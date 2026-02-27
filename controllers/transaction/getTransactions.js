const Transaction = require('../../models/Transaction');
const { buildDateQuery } = require('./filterHelper');

const getTransactions = async (req, res) => {
    try {
        const { page = 1, limit = 10, search, status, range, fromDate, toDate } = req.query;
        const query = {};

        if (search) {
            query.$or = [
                { transactionId: { $regex: search, $options: 'i' } },
                { orderId: { $regex: search, $options: 'i' } },
                { 'user.email': { $regex: search, $options: 'i' } },
                { 'user.name': { $regex: search, $options: 'i' } }
            ];
        }

        if (status && status !== 'All') {
            query.status = status;
        }

        const dateQuery = buildDateQuery(range, fromDate, toDate);
        if (dateQuery) query.date = dateQuery;

        const transactions = await Transaction.find(query)
            .sort({ date: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await Transaction.countDocuments(query);

        res.json({
            transactions: transactions || [],
            totalPages: Math.ceil(total / limit) || 0,
            currentPage: parseInt(page),
            total
        });
    } catch (error) {
        console.error("Error fetching transactions:", error);
        res.status(500).json({ error: "Internal Server Error", transactions: [] });
    }
};

module.exports = getTransactions;