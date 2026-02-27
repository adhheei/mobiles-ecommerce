/**
 * @desc Shared logic to build MongoDB date range query
 */
const buildDateQuery = (range, fromDate, toDate) => {
  const now = new Date();
  let start,
    end = new Date(now);

  if (range === "today") {
    start = new Date(now.setHours(0, 0, 0, 0));
  } else if (range === "7days") {
    start = new Date(now.setDate(now.getDate() - 7));
  } else if (range === "30days") {
    start = new Date(now.setDate(now.getDate() - 30));
  } else if (range === "month") {
    start = new Date(now.getFullYear(), now.getMonth(), 1);
  } else if (fromDate && toDate) {
    start = new Date(fromDate);
    end = new Date(toDate);
    end.setHours(23, 59, 59, 999);
  }

  return start ? { $gte: start, $lte: end } : null;
};

module.exports = { buildDateQuery };
