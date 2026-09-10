import mongoose from "mongoose";

const placeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    category: { type: String, required: true },
    distanceKm: { type: Number, required: true, min: 0, max: 25 },
    description: { type: String, required: true },
    openingHours: { type: String, required: true },
    visitDurationMin: { type: Number, required: true, min: 10, max: 480 },
    entranceFee: { type: String, default: "" },
    tips: { type: String, required: true },
    accessNotes: { type: String, default: "" },
    dressCode: { type: String, default: "" },
    culturalGuidelines: { type: String, default: "" },
    photographyTips: { type: String, default: "" },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    photos: { type: [String], default: [] },
    active: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
    adminNotes: { type: String, default: "" },
  },
  { timestamps: true }
);

placeSchema.index({ category: 1, active: 1, isDeleted: 1 });
placeSchema.index({ name: 1 });
placeSchema.index({ distanceKm: 1 });

export default mongoose.model("Place", placeSchema);