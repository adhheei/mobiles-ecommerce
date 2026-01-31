const express = require("express");
const router = express.Router();
const {
    addAddress,
    getAddresses,
    getAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
} = require("../controllers/addressController");
const { protect } = require("../middleware/authMiddleware");

// Helper middleware to protect routes
router.use(protect);

// Routes
router.post("/", addAddress);
router.get("/", getAddresses);
router.get("/:id", getAddress);
router.put("/:id", updateAddress);
router.delete("/:id", deleteAddress);
router.patch("/:id/default", setDefaultAddress);

module.exports = router;
