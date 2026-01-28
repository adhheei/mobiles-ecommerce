const express = require("express");
const router = express.Router();
const { getProfile, updateProfile, updateAvatar } = require("../controllers/userController");
const { protect } = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");

router.get("/profile", protect, getProfile);
router.put("/profile", protect, updateProfile);
router.put("/avatar", protect, upload.single, updateAvatar);

module.exports = router;
