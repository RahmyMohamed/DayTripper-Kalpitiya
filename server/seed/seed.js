import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import Place from "../models/Place.js";
import User from "../models/User.js";
import Category from "../models/Category.js";
import { DEFAULT_CATEGORIES } from "../models/categoriesData.js";
import { SEED_PLACES } from "../../seed/seedData.js";

dotenv.config();

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/daytripper";

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB");

  for (const name of DEFAULT_CATEGORIES) {
    const slug = slugify(name);
    await Category.updateOne(
      { slug },
      { $set: { name, slug } },
      { upsert: true }
    );
  }
  console.log(`Seeded ${DEFAULT_CATEGORIES.length} categories`);

  const username = process.env.ADMIN_USERNAME || "admin";
  const password = process.env.ADMIN_PASSWORD || "kalpitiya123";
  const passwordHash = await bcrypt.hash(password, 10);
  await User.updateOne(
    { username },
    { $set: { username, passwordHash, role: "admin" } },
    { upsert: true }
  );
  console.log(`Admin user ready: ${username}`);

  for (const place of SEED_PLACES) {
    await Place.updateOne(
      { name: place.name },
      { $set: { ...place, active: true, isDeleted: false } },
      { upsert: true }
    );
  }
  console.log(`Seeded ${SEED_PLACES.length} places`);
  console.log("Seed complete.");
  await mongoose.disconnect();
}

seed().catch(async (error) => {
  console.error("Seed failed:", error);
  await mongoose.disconnect();
  process.exitCode = 1;
});