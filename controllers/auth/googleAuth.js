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

        const clientId = process.env.GOOGLE_CLIENT_ID ? process.env.GOOGLE_CLIENT_ID.trim() : null;
        if (!clientId) {
            console.error("GOOGLE AUTH ERROR: GOOGLE_CLIENT_ID is not configured in environment");
            return res.status(500).json({ success: false, message: "Server configuration error" });
        }

        // Verify the Google ID Token
        const ticket = await client.verifyIdToken({
            idToken: credential,
            audience: clientId,
            clockSkewLeeway: 60, // Allow for 1 minute clock skew
        });

        const payload = ticket.getPayload();
        const { sub: googleId, email, given_name, family_name, picture, name } = payload;

        // Check if user already exists
        let user = await User.findOne({ email });

        if (!user) {
            // Create new Google User
            // Robust name handling: use given_name/family_name if available, otherwise fallback to 'name' or defaults
            const fName = given_name || (name ? name.split(' ')[0] : 'Google');
            const lName = family_name || (name && name.split(' ').length > 1 ? name.split(' ').slice(1).join(' ') : 'User');

            user = await User.create({
                googleId,
                firstName: fName,
                lastName: lName,
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
        console.error("GOOGLE AUTH ERROR:", error.message, error.stack);
        res.status(400).json({
            success: false,
            message: "Google verification failed",
            error: error.message,
            suggestedFix: "Check if your device time is correct or try a different browser."
        });
    }
};

module.exports = { googleSignup };