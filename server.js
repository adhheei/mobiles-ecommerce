// server.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// 📁 Create upload directories (add products too!)
const uploadDirs = [
  "./public/uploads/categories",
  "./public/uploads/products", // 👈 Add this for future products
];
uploadDirs.forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`📁 Created directory: ${dir}`);
  }
});

// 🔧 Middleware
app.use(helmet());
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "https://accounts.google.com",
        "https://cdn.jsdelivr.net",
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
      imgSrc: [
        "'self'",
        "data:",
        "https://lh3.googleusercontent.com",
        "https://placehold.co"
      ],
      connectSrc: [
        "'self'",
        "https://accounts.google.com",
        "https://cdn.jsdelivr.net",
      ],
      frameSrc: ["https://accounts.google.com"],
      fontSrc: [
        "'self'",
        "https://cdnjs.cloudflare.com",
        "https://fonts.gstatic.com",
      ],
      scriptSrcAttr: ["'unsafe-inline'"], // Allow inline event handlers
    },
  }),
);
app.use(require("cookie-parser")()); // 🍪 Cookie parser
app.use(cors());
app.use(morgan("combined"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(express.static("public"));

//  favicon.ico ignore
app.get('/favicon.ico', (req, res) => res.status(204).end());

// 🛣️ Routes
const adminRoutes = require("./routes/adminRoutes");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
app.use("/api/admin", adminRoutes); // admin routes
app.use("/api/auth", authRoutes); // auth routes
app.use("/api/user", userRoutes); // user routes
app.use("/api/contact", require("./routes/contactRoutes")); // contact routes

// 🏠 Home route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// 🔄 Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  });

// 🚀 Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
