const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

const app = express();

// ─── SECURITY ────────────────────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));

app.use(cors({
  origin: process.env.CLIENT_URL || "*",
  credentials: true
}));

app.use(express.json({ limit: "10mb" }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { error: "Too many requests" }
});
app.use("/api/", limiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: "Too many auth attempts" }
});

// ─── DATABASE ─────────────────────────────────────────────────────────────────
// NOTE: MONGO_URI must be set in Vercel Environment Variables dashboard
// It should be a MongoDB Atlas URI, NOT localhost
let isConnected = false;

async function connectDB() {
  if (isConnected) return;
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
    });
    isConnected = true;
    console.log("✅ MongoDB connected");
  } catch (err) {
    console.error("❌ MongoDB error:", err.message);
    // Don't crash — Vercel serverless functions are stateless
  }
}

// Connect on every cold start
connectDB();

// ─── ROUTES ──────────────────────────────────────────────────────────────────
app.use("/auth", authLimiter, require("./routes/auth"));
app.use("/api/projects", require("./routes/project"));

// ─── STATIC FILES ─────────────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, "public")));

// ─── PAGE ROUTES ──────────────────────────────────────────────────────────────
app.get("/app",       (req, res) => res.sendFile(path.join(__dirname, "public", "app.html")));
app.get("/dashboard", (req, res) => res.sendFile(path.join(__dirname, "public", "dashboard.html")));
app.get("/feedback",  (req, res) => res.sendFile(path.join(__dirname, "public", "feedback.html")));
app.get("/home",      (req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));
app.get("/index",     (req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));
app.get("/login",     (req, res) => res.sendFile(path.join(__dirname, "public", "login.html")));
app.get("/",          (req, res) => res.sendFile(path.join(__dirname, "public", "login.html")));
app.get("*",          (req, res) => res.sendFile(path.join(__dirname, "public", "login.html")));

// ─── LOCAL DEV ONLY ───────────────────────────────────────────────────────────
// Vercel ignores app.listen() — it uses the exported app instead.
// This block only runs when you do `node server.js` locally.
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
}

// ─── EXPORT FOR VERCEL ────────────────────────────────────────────────────────
module.exports = app;