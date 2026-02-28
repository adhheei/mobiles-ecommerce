const jwt = require("jsonwebtoken");

/**
 * @desc    Create token, save in cookie and send response
 * @param   {Object} user - The user document from MongoDB
 * @param   {Number} statusCode - HTTP status code (e.g., 200, 201)
 * @param   {Object} res - Express response object
 */
const sendTokenResponse = (user, statusCode, res) => {
    // 1. Generate JWT
    const token = jwt.sign(
        { id: user._id, role: user.role }, 
        process.env.JWT_SECRET || "supersecretkey", 
        { expiresIn: "30d" }
    );

    // 2. Define Cookie Options
    const options = {
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        httpOnly: true, // Prevents client-side scripts from accessing the cookie
        secure: process.env.NODE_ENV === "production", // Only send over HTTPS in production
        sameSite: "lax", // Protects against CSRF
    };

    // 3. Send Response
    res
        .status(statusCode)
        .cookie("token", token, options)
        .json({
            success: true,
            token,
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: user.role,
                profileImage: user.profileImage || null,
            },
        });
};

module.exports = sendTokenResponse;