const router = require("express").Router();
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const User = require("../models/User");
const authMiddleware = require("../middleware/auth");

// Generate JWT
const signToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "7d" });


// ─── REGISTER ─────────────────────────────────────────────
router.post(
  "/register",
  [
    body("name")
      .trim()
      .isLength({ min: 3, max: 30 })
      .withMessage("Username must be 3–30 characters")
      .matches(/^[a-zA-Z0-9_.-]+$/)
      .withMessage("Username can only contain letters, numbers, ., _, -"),

    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: errors.array()[0].msg,
      });
    }

    try {
      const { name, password } = req.body;

      // Case-insensitive username check
      const exists = await User.findOne({
        name: new RegExp(`^${name}$`, "i"),
      });

      if (exists) {
        return res.status(409).json({
          message: "Username already taken",
        });
      }

      const user = await User.create({ name, password });
      const token = signToken(user._id);

      res.status(201).json({
        message: "Account created!",
        userId: user._id,
        token,
        user: {
          name: user.name,
          createdAt: user.createdAt,
        },
      });
    } catch (err) {
      console.error("REGISTER ERROR:", err);
      res.status(500).json({
        message: "Server error",
      });
    }
  }
);


// ─── LOGIN ────────────────────────────────────────────────
router.post(
  "/login",
  [
    body("name").trim().notEmpty().withMessage("Username required"),
    body("password").notEmpty().withMessage("Password required"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: errors.array()[0].msg,
      });
    }

    try {
      const { name, password } = req.body;

      const user = await User.findOne({
        name: new RegExp(`^${name}$`, "i"),
      }).select("+password");

      if (!user) {
        return res.status(401).json({
          message: "Invalid credentials",
        });
      }

      const match = await user.comparePassword(password);

      if (!match) {
        return res.status(401).json({
          message: "Invalid credentials",
        });
      }

      user.lastLogin = new Date();
      await user.save();

      const token = signToken(user._id);

      res.json({
        userId: user._id,
        token,
        user: {
          name: user.name,
          lastLogin: user.lastLogin,
        },
      });
    } catch (err) {
      console.error("LOGIN ERROR:", err);
      res.status(500).json({
        message: "Server error",
      });
    }
  }
);


// ─── ME (Protected Route) ─────────────────────────────────
router.get("/me", authMiddleware, (req, res) => {
  res.json({ user: req.user });
});


module.exports = router;