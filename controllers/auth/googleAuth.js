const { OAuth2Client } = require("google-auth-library");
const User = require("../../models/User");
const sendTokenResponse = require("../../utils/sendToken");

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * @desc    Google Login/Signup
 * @route   POST /api/auth/google
 * @access  Public
 */
const googleSignup = async (req, res) => {
    try {
        const { credential } = req.body;

        if (!credential) {
            return res.status(400).json({ success: false, message: "Google token is required" });
        }

        // Verify the Google ID Token
        const ticket = await client.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        const { sub: googleId, email, given_name, family_name, picture } = payload;

        // Check if user already exists
        let user = await User.findOne({ email });

        if (!user) {
            // Create new Google User
            user = await User.create({
                googleId,
                firstName: given_name,
                lastName: family_name || " ",
                email,
                profileImage: picture,
                isGoogleUser: true,
                isVerified: true, // Google users are pre-verified
            });
        } else {
            // Update existing user to link Google ID if not already linked
            if (!user.googleId) {
                user.googleId = googleId;
                user.isGoogleUser = true;
                user.isVerified = true; 
                await user.save();
            }
        }

        // Use our utility to send the JWT and Cookie
        return sendTokenResponse(user, 200, res);

    } catch (error) {
        console.error("GOOGLE AUTH ERROR:", error.message);
        res.status(400).json({
            success: false,
            message: "Google verification failed",
            error: error.message,
        });
    }
};

module.exports = { googleSignup };