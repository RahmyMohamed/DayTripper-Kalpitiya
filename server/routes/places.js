import { Router } from "express";
import Place from "../models/Place.js";
import { requireAuth } from "../middleware/auth.js";
import { DEFAULT_CATEGORIES } from "../models/categoriesData.js";

const router = Router();

const VALID = new Set(DEFAULT_CATEGORIES);

function publicView(p) {
  return {
    id: p._id,
    name: p.name,
    category: p.category,
    distanceKm: p.distanceKm,
    description: p.description,
    openingHours: p.openingHours,
    visitDurationMin: p.visitDurationMin,
    entranceFee: p.entranceFee,
    tips: p.tips,
    accessNotes: p.accessNotes,
    dressCode: p.dressCode,
    culturalGuidelines: p.culturalGuidelines,
    photographyTips: p.photographyTips,
    latitude: p.latitude,
    longitude: p.longitude,
    photos: p.photos,
    updatedAt: p.updatedAt,
  };
}

function adminView(p) {
  return {
    ...publicView(p),
    active: p.active,
    isDeleted: p.isDeleted,
    adminNotes: p.adminNotes,
    createdAt: p.createdAt,
  };
}

// Public: list active places
router.get("/", async (req, res) => {
  try {
    const { q, category, sort } = req.query;
    const filter = { active: true, isDeleted: { $ne: true } };

    if (category && category !== "All") filter.category = category;

    if (q && q.trim()) {
      const rx = new RegExp(escapeRegex(q.trim()), "i");
      filter.$or = [{ name: rx }, { description: rx }];
    }

    let query = Place.find(filter);
    query = sort === "name" ? query.sort({ name: 1 }) : query.sort({ distanceKm: 1 });

    const places = await query.lean();
    return res.json(places.map(publicView));
  } catch (err) {
    console.error("List error:", err.message);
    return res.status(500).json({ message: "Failed to load catalogue" });
  }
});

// Public: categories with counts for active places
router.get("/categories", async (req, res) => {
  try {
    const counts = await Place.aggregate([
      { $match: { active: true, isDeleted: { $ne: true } } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
    ]);
    const countMap = Object.fromEntries(counts.map((c) => [c._id, c.count]));
    const used = DEFAULT_CATEGORIES.map((c) => ({
      name: c,
      count: countMap[c] || 0,
    })).filter((c) => c.count > 0);
    return res.json(used);
  } catch (err) {
    return res.status(500).json({ message: "Failed to load categories" });
  }
});

// Public: single place
router.get("/:id", async (req, res) => {
  try {
    const place = await Place.findOne({
      _id: req.params.id,
      active: true,
      isDeleted: { $ne: true },
    }).lean();
    if (!place) return res.status(404).json({ message: "Place not found" });
    return res.json(publicView(place));
  } catch (err) {
    return res.status(404).json({ message: "Place not found" });
  }
});

// Admin-only: all places (including soft-deleted)
router.get("/admin/all", requireAuth, async (req, res) => {
  try {
    const places = await Place.find({}).sort({ distanceKm: 1 }).lean();
    return res.json(places.map(adminView));
  } catch (err) {
    return res.status(500).json({ message: "Failed to load places" });
  }
});

// Admin-only: create place
router.post("/", requireAuth, async (req, res) => {
  try {
    const cleaned = clean(req.body);
    const errors = validate(cleaned);
    if (errors.length) return res.status(400).json({ errors });
    const place = await Place.create(cleaned);
    return res.status(201).json({ place: adminView(place) });
  } catch (err) {
    console.error("Create error:", err.message);
    return res.status(500).json({ message: "Failed to create place" });
  }
});

// Admin-only: update place (full)
router.put("/:id", requireAuth, async (req, res) => {
  try {
    const cleaned = clean(req.body);
    const errors = validate(cleaned);
    if (errors.length) return res.status(400).json({ errors });
    const place = await Place.findByIdAndUpdate(req.params.id, cleaned, {
      new: true,
      runValidators: true,
    });
    if (!place) return res.status(404).json({ message: "Place not found" });
    return res.json({ place: adminView(place) });
  } catch (err) {
    return res.status(500).json({ message: "Failed to update place" });
  }
});

// Admin-only: partial update (inline edit)
router.patch("/:id", requireAuth, async (req, res) => {
  try {
    const partial = clean(req.body, true);
    const errors = validate(partial, true);
    if (errors.length) return res.status(400).json({ errors });

    const place = await Place.findById(req.params.id);
    if (!place) return res.status(404).json({ message: "Place not found" });

    for (const key of Object.keys(partial)) place[key] = partial[key];
    await place.save();
    return res.json({ place: adminView(place) });
  } catch (err) {
    return res.status(500).json({ message: "Failed to update place" });
  }
});

// Admin-only: soft-delete
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const place = await Place.findByIdAndUpdate(
      req.params.id,
      { active: false, isDeleted: true },
      { new: true }
    );
    if (!place) return res.status(404).json({ message: "Place not found" });
    return res.json({ message: "Place soft-deleted", place: adminView(place) });
  } catch (err) {
    return res.status(500).json({ message: "Failed to delete place" });
  }
});

// Admin-only: restore soft-deleted
router.post("/restore/:id", requireAuth, async (req, res) => {
  try {
    const place = await Place.findByIdAndUpdate(
      req.params.id,
      { active: true, isDeleted: false },
      { new: true }
    );
    if (!place) return res.status(404).json({ message: "Place not found" });
    return res.json({ message: "Place restored", place: adminView(place) });
  } catch (err) {
    return res.status(500).json({ message: "Failed to restore place" });
  }
});

// Admin-only: bulk update
router.post("/bulk-update", requireAuth, async (req, res) => {
  try {
    const { ids, updates } = req.body || {};
    if (!Array.isArray(ids) || !ids.length) {
      return res.status(400).json({ message: "No records selected" });
    }
    const patch = clean(updates || {}, true);
    if (!Object.keys(patch).length) {
      return res.status(400).json({ message: "No updates provided" });
    }

    // Only allow fields safe for bulk updates
    const allowed = ["category", "distanceKm", "tips", "entranceFee", "visitDurationMin", "active"];
    const safePatch = {};
    for (const k of Object.keys(patch)) {
      if (allowed.includes(k)) safePatch[k] = patch[k];
    }

    const ok = [];
    const invalid = [];
    for (const id of ids) {
      try {
        const errors = validate(safePatch, true);
        if (errors.length) {
          invalid.push({ id, errors });
          continue;
        }
        const doc = await Place.findById(id);
        if (!doc) {
          invalid.push({ id, errors: ["not found"] });
          continue;
        }
        for (const key of Object.keys(safePatch)) doc[key] = safePatch[key];
        await doc.save();
        ok.push(id);
      } catch (e) {
        invalid.push({ id, errors: [e.message] });
      }
    }

    return res.json({ successCount: ok.length, invalidCount: invalid.length, invalid });
  } catch (err) {
    return res.status(500).json({ message: "Bulk update failed" });
  }
});

function clean(body, partial = false) {
  const out = {};
  const stringFields = [
    "name", "category", "description", "openingHours", "entranceFee",
    "tips", "accessNotes", "dressCode", "culturalGuidelines",
    "photographyTips", "adminNotes",
  ];
  const numberFields = ["distanceKm", "visitDurationMin", "latitude", "longitude"];
  const boolFields = ["active", "isDeleted"];

  for (const f of stringFields) {
    if (body[f] !== undefined) out[f] = body[f];
    else if (!partial) out[f] = "";
  }
  for (const f of numberFields) {
    if (body[f] !== undefined) out[f] = Number(body[f]);
  }
  for (const f of boolFields) {
    if (body[f] !== undefined) out[f] = Boolean(body[f]);
    else if (!partial) out[f] = f === "active";
  }
  if (body.photos !== undefined) {
    out.photos = Array.isArray(body.photos) ? body.photos : [body.photos];
  } else if (!partial) {
    out.photos = [];
  }
  return out;
}

function validate(cleaned, partial = false) {
  const errors = [];
  const required = partial
    ? []
    : ["name", "category", "distanceKm", "description", "openingHours", "visitDurationMin", "tips", "latitude", "longitude"];

  for (const field of required) {
    if (cleaned[field] === undefined || cleaned[field] === null || cleaned[field] === "") {
      errors.push(`${label(field)} is required`);
    }
  }

  if (cleaned.distanceKm !== undefined && cleaned.distanceKm !== "") {
    if (!Number.isFinite(cleaned.distanceKm) || cleaned.distanceKm < 0 || cleaned.distanceKm > 25)
      errors.push("Distance must be between 0 and 25 km");
  }
  if (cleaned.latitude !== undefined && cleaned.latitude !== "") {
    if (!Number.isFinite(cleaned.latitude) || cleaned.latitude < 5.5 || cleaned.latitude > 10)
      errors.push("Latitude must be between 5.5 and 10.0");
  }
  if (cleaned.longitude !== undefined && cleaned.longitude !== "") {
    if (!Number.isFinite(cleaned.longitude) || cleaned.longitude < 79 || cleaned.longitude > 82.5)
      errors.push("Longitude must be between 79.0 and 82.5");
  }
  if (cleaned.visitDurationMin !== undefined && cleaned.visitDurationMin !== "") {
    const v = Number(cleaned.visitDurationMin);
    if (!Number.isInteger(v) || v < 10 || v > 480)
      errors.push("Visit duration must be an integer between 10 and 480 minutes");
  }
  if (cleaned.category && cleaned.category !== "" && !VALID.has(cleaned.category)) {
    errors.push("Invalid category");
  }
  if (
    cleaned.description !== undefined &&
    cleaned.description !== "" &&
    String(cleaned.description).trim().length < 20
  ) {
    errors.push("Description should be at least 20 characters");
  }
  return errors;
}

function label(field) {
  const map = {
    distanceKm: "Distance",
    visitDurationMin: "Visit duration",
    openingHours: "Opening hours",
    latitude: "Latitude",
    longitude: "Longitude",
  };
  return map[field] || field.charAt(0).toUpperCase() + field.slice(1);
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export default router;