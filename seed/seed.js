import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import Place from "../models/Place.js";
import User from "../models/User.js";
import Category from "../models/Category.js";
import { DEFAULT_CATEGORIES } from "../models/categoriesData.js";
import { SEED_PLACES } from "./seedData.js";

dotenv.config();

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/daytripper";

const PLACE_PHOTO = {
  "Kalpitiya Dutch Fort":
    "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&q=80",
  "Kudawa Natural Pool":
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80",
  "Kandakuliya Beach":
    "https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=800&q=80",
  "Kitesurfing Lanka":
    "https://images.unsplash.com/photo-1539476392766-4f33c2c2c8d4?w=800&q=80",
  "Donkey Point Beach Camping":
    "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800&q=80",
  "Uchchimuni Beach":
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80",
  "The Majestical Sperm Whale":
    "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80",
  "Oyster Farm":
    "https://images.unsplash.com/photo-1615141982883-c7ad0e69fd62?w=800&q=80",
  "Kappalady Kite Lagoon":
    "https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=800&q=80",
};

function slugify(str) {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB");

  // Seed categories
  for (const name of DEFAULT_CATEGORIES) {
    const slug = slugify(name);
    await Category.updateOne(
      { slug },
      { $set: { name, slug } },
      { upsert: true }
    );
  }
  console.log(`Seeded ${DEFAULT_CATEGORIES.length} categories`);

  // Seed admin user
  const username = process.env.ADMIN_USERNAME || "admin";
  const password = process.env.ADMIN_PASSWORD || "kalpitiya123";
  const passwordHash = await bcrypt.hash(password, 10);
  await User.updateOne(
    { username },
    { $set: { username, passwordHash, role: "admin" } },
    { upsert: true }
  );
  console.log(`Admin user ready: ${username}`);

  // Seed places
  for (const p of SEED_PLACES) {
    const photo = PLACE_PHOTO[p.name];
    const data = { ...p, photos: photo ? [photo] : [], active: true, isDeleted: false };
    await Place.updateOne({ name: p.name }, { $set: data }, { upsert: true });
  }
  console.log(`Seeded ${SEED_PLACES.length} places`);

  console.log("Seed complete.");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});