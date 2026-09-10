import express from "express";
import session from "express-session";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import placeRoutes from "./routes/places.js";
import authRoutes from "./routes/auth.js";
import categoryRoutes from "./routes/categories.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";
const NODE_ENV = process.env.NODE_ENV || "development";

app.use(
  cors({
    origin: CLIENT_ORIGIN,
    credentials: true,
  })
);
app.use(express.json());

app.set("trust proxy", 1);
app.use(
  session({
    name: "sid",
    secret: process.env.SESSION_SECRET || "dev-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 8 * 60 * 60 * 1000,
    },
  })
);

app.get("/api/health", (req, res) => res.json({ status: "ok" }));
app.use("/api/auth", authRoutes);
app.use("/api/places", placeRoutes);
app.use("/api/categories", categoryRoutes);

app.use((req, res) => res.status(404).json({ message: "Not found" }));

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ message: "Invalid JSON body" });
  }
  console.error(err);
  return res.status(500).json({ message: "Internal server error" });
});

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`API running on http://localhost:${PORT}`);
  });
});