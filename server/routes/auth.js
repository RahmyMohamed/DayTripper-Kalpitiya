import { Router } from "express";
import bcrypt from "bcryptjs";
import User from "../models/User.js";

const router = Router();

const failedAttempts = new Map();

router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) {
      return res
        .status(400)
        .json({ message: "Username and password are required" });
    }

    const key = String(username).toLowerCase();
    const attempt = failedAttempts.get(key) || { count: 0, until: 0 };

    if (attempt.until > Date.now()) {
      return res.status(429).json({
        message: "Too many failed attempts. Please wait a moment and try again.",
      });
    }

    const user = await User.findOne({
      username: { $regex: `^${escapeRegex(username)}$`, $options: "i" },
    });

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      attempt.count += 1;
      if (attempt.count >= 5) {
        attempt.until = Date.now() + 60 * 1000;
        attempt.count = 0;
      }
      failedAttempts.set(key, attempt);
      return res.status(401).json({ message: "Invalid username or password" });
    }

    failedAttempts.delete(key);

    req.session.userId = user._id.toString();
    req.session.role = user.role;
    req.session.username = user.username;

    return res.json({
      user: { id: user._id, username: user.username, role: user.role },
    });
  } catch (err) {
    console.error("Login error:", err.message);
    return res.status(500).json({ message: "Login failed" });
  }
});

router.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("sid", { httpOnly: true });
    return res.json({ message: "Logged out" });
  });
});

router.get("/session", (req, res) => {
  if (req.session && req.session.userId) {
    return res.json({
      user: {
        id: req.session.userId,
        username: req.session.username,
        role: req.session.role,
      },
    });
  }
  return res.json({ user: null });
});

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export default router;