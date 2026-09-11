export const CATEGORIES = [
  "Heritage",
  "Natural Landmark",
  "Water Sports",
  "Historical Landmark",
  "Campground",
  "Museum/Educational",
  "Aquaculture",
  "Sightseeing",
  "Religious",
  "Cultural",
  "Monument",
  "Local Dining",
];

export const INTEREST_MAP = {
  Nature: ["Natural Landmark", "Aquaculture", "Sightseeing"],
  Culture: [
    "Heritage",
    "Historical Landmark",
    "Religious",
    "Cultural",
    "Monument",
    "Museum/Educational",
  ],
  Heritage: [
    "Heritage",
    "Historical Landmark",
    "Monument",
    "Museum/Educational",
    "Religious",
    "Cultural",
  ],
  "Water Sports": ["Water Sports", "Campground"],
};

export const INTERESTS = ["Nature", "Culture", "Heritage", "Water Sports"];

export const CATEGORY_META = {
  Heritage: { color: "#f59e0b" },
  "Natural Landmark": { color: "#10b981" },
  "Water Sports": { color: "#0ea5e9" },
  "Historical Landmark": { color: "#8b5cf6" },
  Campground: { color: "#f97316" },
  "Museum/Educational": { color: "#ec4899" },
  Aquaculture: { color: "#14b8a6" },
  Sightseeing: { color: "#84cc16" },
  Religious: { color: "#ef4444" },
  Cultural: { color: "#a855f7" },
  Monument: { color: "#78716c" },
  "Local Dining": { color: "#eab308" },
};

export const EMOJI_BY_NAME = {
  "Kalpitiya Dutch Fort": "🏰",
  "Kudawa Natural Pool": "💧",
  "Kandakuliya Beach": "🏖️",
  "Kitesurfing Lanka": "🪁",
  "Allarani Ruins": "🏛️",
  "Donkey Point Beach Camping": "⛺",
  "Uchchimuni Beach": "🌅",
  "The Majestical Sperm Whale": "🐋",
  "Oyster Farm": "🦪",
  "Kappalady Kite Lagoon": "🏄",
};

export const EMOJI_BY_CATEGORY = {
  Heritage: "🏰",
  "Natural Landmark": "🌿",
  "Water Sports": "🪁",
  "Historical Landmark": "🏛️",
  Campground: "⛺",
  "Museum/Educational": "🏛️",
  Aquaculture: "🦪",
  Sightseeing: "🧭",
  Religious: "🕌",
  Cultural: "🪘",
  Monument: "🗿",
  "Local Dining": "🍽️",
};

export function categoryColor(cat) {
  return CATEGORY_META[cat]?.color || "#64748b";
}

export function enrichPlace(p) {
  return {
    ...p,
    emoji: EMOJI_BY_NAME[p.name] || EMOJI_BY_CATEGORY[p.category] || "📍",
    image: Array.isArray(p.photos) && p.photos.length ? p.photos[0] : null,
  };
}

export function enrichPlaces(list = []) {
  return list.map(enrichPlace);
}