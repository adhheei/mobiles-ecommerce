/**
 * @desc Standardizes file paths for frontend consumption
 */
const formatImageUrl = (filePath) => {
    if (!filePath) return "";
    return (
        "/" +
        filePath
            .replace(/\\/g, "/")
            .replace(/^public\//, "")
            .replace(/^\//, "")
    );
};

module.exports = { formatImageUrl };