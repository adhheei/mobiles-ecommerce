const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const pendingUserSchema = new mongoose.Schema(
    {
        firstName: { type: String, required: true, trim: true },
        lastName: { type: String, required: true, trim: true },
        email: { type: String, required: true, unique: true, lowercase: true },
        phone: { type: String, required: true }, // Not unique here to allow retries? Or unique? Let's keep strict constraint but TTL will handle cleanup.
        password: { type: String, required: true },
        otp: { type: String, required: true },
        otpExpires: { type: Date, required: true },
        createdAt: { type: Date, default: Date.now, expires: 600 } // Auto-delete after 10 mins (TTL)
    },
    { timestamps: true }
);

// Hash password before saving pending user? 
// Yes, better to hash immediately so we don't store plain text even temporarily.
pendingUserSchema.pre("save", async function () {
    if (!this.isModified("password")) return;
    this.password = await bcrypt.hash(this.password, 10);
});

module.exports = mongoose.model("PendingUser", pendingUserSchema);
