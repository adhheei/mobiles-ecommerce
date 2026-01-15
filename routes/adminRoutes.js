const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const multer = require("multer");

// Setup storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "public/uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage: storage });

// Define the fields exactly as named in your frontend formData.append()
const productUpload = upload.fields([
  { name: "mainImage", maxCount: 1 },
  { name: "gallery", maxCount: 10 },
]);

router.post("/add-product", productUpload, adminController.addProduct);
router.get('/list-products', adminController.listProducts);
router.delete('/delete-product/:id', adminController.deleteProduct);
router.get('/get-product/:id', adminController.getSingleProduct);
router.put('/update-product/:id', productUpload, adminController.updateProduct);    

module.exports = router;
