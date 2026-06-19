export const categories = [
  "Fruit & Veg",
  "Dairy",
  "Bakery",
  "Meat",
  "Pantry",
  "Snacks",
  "Frozen",
  "Household",
  "Toiletries",
  "Other",
];

// Categories that have been merged away. Saved items (and any persisted
// shopping lists) are remapped through normaliseCategory on load so nothing
// shows under a retired label. "Herbs & Spices" and "Condiments" both folded
// into "Pantry" — one shelf-stable aisle instead of three overlapping ones.
const LEGACY_CATEGORY_MAP = {
  "Herbs & Spices": "Pantry",
  Condiments: "Pantry",
};

// Map a stored category onto the current set. Unknown (user-created) and empty
// values pass through untouched — callers apply their own fallbacks.
export function normaliseCategory(category) {
  if (!category) return category;
  return LEGACY_CATEGORY_MAP[category] || category;
}
