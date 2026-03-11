const express = require("express");
const router = express.Router();
const { isAdmin } = require("../../middleware/authMiddleware");
const { getAdminProfile, updateAdminProfile } = require("../../controllers/admin/getAdminProfile");
const changeAdminPassword = require("../../controllers/admin/changeAdminPassword");

router.get("/profile", isAdmin, getAdminProfile);
router.put("/profile", isAdmin, updateAdminProfile);
router.put("/change-password", isAdmin, changeAdminPassword);

module.exports = router;
