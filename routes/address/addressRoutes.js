const express = require("express");
const router = express.Router();
const {
    addAddress,
    getAddresses,
    getAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
} = require("../../controllers/address");
const { protect } = require("../../middleware/authMiddleware");

router.use(protect);

router.post("/", addAddress);
router.get("/", getAddresses);
router.get("/:id", getAddress);
router.put("/:id", updateAddress);
router.delete("/:id", deleteAddress);

router.patch("/:id/default", setDefaultAddress); 

module.exports = router;