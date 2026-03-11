const express = require("express");
const router = express.Router();
const { isAdmin } = require("../../middleware/authMiddleware");
const offer = require("../../controllers/offer");

// Mounted at /api/admin/offers
router.get("/hot", offer.getHotDeals);
router.get("/", offer.getAllOffers);
router.post("/", isAdmin, offer.addOffer);
router.get("/:id", offer.getOfferById);
router.put("/update/:id", isAdmin, offer.updateOffer);
router.delete("/:id", isAdmin, offer.deleteOffer);

module.exports = router;
