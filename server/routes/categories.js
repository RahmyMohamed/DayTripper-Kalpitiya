import { Router } from "express";
import Category from "../models/Category.js";
import Place from "../models/Place.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const categories = await Category.find({}).sort({ name: 1 }).lean();
    return res.json(categories);
  } catch (err) {
    return res.status(500).json({ message: "Failed to load categories" });
  }
});

router.post("/", requireAuth, async (req, res) => {
  try {
    const name = (req.body?.name || "").trim();
    if (!name) return res.status(400).json({ message: "Category name is required" });

    const existing = await Category.findOne({
      name: { $regex: `^${name}$`, $options: "i" },
    });
    if (existing) return res.status(400).json({ message: "Category already exists" });

    const category = await Category.create({ name, slug: slugify(name) });
    return res.status(201).json({ category });
  } catch (err) {
    return res.status(500).json({ message: "Failed to create category" });
  }
});

router.put("/:id", requireAuth, async (req, res) => {
  try {
    const name = (req.body?.name || "").trim();
    if (!name) return res.status(400).json({ message: "Category name is required" });

    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ message: "Category not found" });

    await Place.updateMany(
      { category: category.name },
      { $set: { category: name } }
    );

    category.name = name;
    category.slug = slugify(name);
    await category.save();

    return res.json({ category });
  } catch (err) {
    return res.status(500).json({ message: "Failed to rename category" });
  }
});

router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ message: "Category not found" });

    const inUse = await Place.countDocuments({ category: category.name });
    if (inUse > 0) {
      return res.status(409).json({
        message: `Category "${category.name}" is referenced by ${inUse} place(s). Reassign them first.`,
      });
    }

    await category.deleteOne();
    return res.json({ message: "Category deleted" });
  } catch (err) {
    return res.status(500).json({ message: "Failed to delete category" });
  }
});

function slugify(str) {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default router;