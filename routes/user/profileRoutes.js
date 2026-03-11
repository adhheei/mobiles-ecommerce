const express = require("express");
const router = express.Router();
const user = require("../../controllers/user");
const upload = require("../../middleware/upload");

// Mounted at /api/user
router.get("/profile", user.getProfile);
router.put("/profile", user.updateProfile);
router.put("/avatar", upload.single, user.updateAvatar);
router.delete("/avatar", user.removeAvatar);
router.post("/change-password", user.changePassword);

module.exports = router;
