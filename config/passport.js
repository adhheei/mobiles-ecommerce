const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User'); // Adjust if your User model is elsewhere

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (err) {
        done(err, null);
    }
});

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/api/auth/google/callback",
    proxy: true
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // 1. Check if user exists by googleId or email
      let user = await User.findOne({ 
        $or: [{ googleId: profile.id }, { email: profile.emails[0].value }] 
      });

      if (user) {
        // Update googleId if they previously registered with email
        if (!user.googleId) {
            user.googleId = profile.id;
            await user.save();
        }
        return done(null, user);
      }

      // 2. Create new user if they don't exist
      user = await User.create({
        googleId: profile.id,
        fullName: profile.displayName,
        email: profile.emails[0].value,
        profilePic: profile.photos[0].value,
        isVerified: true,
        password: Math.random().toString(36).slice(-10) // Dummy password for schema requirements
      });
      
      done(null, user);
    } catch (err) {
      done(err, null);
    }
  }
));