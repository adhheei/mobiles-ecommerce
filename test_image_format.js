
const formatImageUrl = (filePath) => {
    if (!filePath) return "";
    // Ensure we use forward slashes and remove 'public' if it's at the start
    return "/" + filePath.replace(/\\/g, "/").replace(/^public\//, "").replace(/^\//, "");
};

console.log("1:", formatImageUrl("public\\uploads\\products\\test.jpg"));
console.log("2:", formatImageUrl("public/uploads/products/test.jpg"));
console.log("3:", formatImageUrl("uploads/products/test.jpg"));
console.log("4:", formatImageUrl(""));
console.log("5:", formatImageUrl(null));
console.log("6:", formatImageUrl(undefined));

try {
    console.log("7:", formatImageUrl(123));
} catch (e) {
    console.log("7: Error caught", e.message);
}
