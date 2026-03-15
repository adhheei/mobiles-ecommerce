const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const path = require("path");
const fs = require("fs");
const passport = require("passport");
const cookieParser = require("cookie-parser");
const session = require("express-session");
require("dotenv").config();
require("./config/passport");

const app = express();
const PORT = process.env.PORT || 5000;

// 📁 Ensure Upload Directories Exist
const uploadDirs = ["./public/uploads/categories", "./public/uploads/products"];
uploadDirs.forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// 🔧 Security & Logic Middleware
app.use(
  helmet({
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "https://accounts.google.com",
          "https://cdn.jsdelivr.net",
          "https://checkout.razorpay.com",
          "https://cdnjs.cloudflare.com",
          "'unsafe-inline'",
        ],
        styleSrc: [
          "'self'",
          "https://cdn.jsdelivr.net",
          "https://cdnjs.cloudflare.com",
          "https://accounts.google.com",
          "https://fonts.googleapis.com",
          "'unsafe-inline'",
        ],
        imgSrc: ["'self'", "data:", "blob:", "https://*", "http://localhost:*", "http://3.27.6.57:*", "https://3.27.6.57:*"],
        connectSrc: [
          "'self'",
          "http://localhost:*",
          "ws://localhost:*",
          "http://3.27.6.57:*",
          "ws://3.27.6.57:*",
          "https://3.27.6.57:*",
          "https://accounts.google.com",
          "https://*.razorpay.com",
          "https://cdn.jsdelivr.net",
        ],
        frameSrc: ["https://accounts.google.com", "https://*.razorpay.com"],
        fontSrc: [
          "'self'",
          "https://cdnjs.cloudflare.com",
          "https://fonts.gstatic.com",
        ],
        scriptSrcAttr: ["'unsafe-inline'"],
      },
    },
  }),
);

// Allow requests from your specific IP or all origins for now
app.use(cors({
    origin: '*', // This allows all connections - good for testing
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(morgan("dev")); // Changed to 'dev' for cleaner console logs
app.use(cookieParser());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
// 1. Static Assets
app.use(express.static(path.join(__dirname, 'public'))); // Shared assets (css, js, images)
app.use("/admin", express.static(path.join(__dirname, 'public', 'Admin')));
app.use("/user", express.static(path.join(__dirname, 'public', 'User')));

app.set('trust proxy', 1);

// 🍪 Session & Passport
app.use(
  session({
    secret: process.env.SESSION_SECRET || "jinsa_secret_key",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: process.env.NODE_ENV === "production" },
  }),
);
app.use(passport.initialize());
app.use(passport.session());

// 🛣️ Routes
app.use("/api", require("./routes"));
app.use("/user/api", require("./routes")); // Support for /user/api prefix

// 🏠 Admin Route
app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "Admin", "adminDashboard.html"));
});

// 🏠 User Route
app.get("/user", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "User", "index.html"));
});

// 🏠 Root Redirect
app.get("/", (req, res) => {
  res.redirect("/user");
});

app.get("/favicon.ico", (req, res) => res.status(204).end());

// 2. Catch-all Routing
app.use((req, res, next) => {
    // Skip API requests
    if (req.path.startsWith('/api')) {
      return next();
    }
    
    // If request starts with /admin, but wasn't handled by static or explicit route
    if (req.path.startsWith('/admin')) {
      return res.sendFile(path.join(__dirname, 'public', 'Admin', 'adminDashboard.html'));
    }

    // If request starts with /user, but wasn't handled by static or explicit route
    if (req.path.startsWith('/user')) {
      return res.sendFile(path.join(__dirname, 'public', 'User', 'index.html'));
    }
    
    // Default to redirecting to /user for all other routes
    res.redirect("/user");
});


mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB Error:", err.message));

app.use((err, req, res, next) => {
  console.error("🔥 Server Error:", err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Unexpected Server Error",
  });
});

app.listen(PORT, () => console.log(`🚀 Server: http://localhost:${PORT}`));
