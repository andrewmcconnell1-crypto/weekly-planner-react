// A stable colour tone per shopping aisle / stock category, so the long Stock,
// Recurring and Shop lists get visual rhythm instead of rows of identical olive
// headings. Mirrors the recipe `data-tone` system: the tone key maps to a
// `--aisle-tone` custom property in CSS (see App.css).

const AISLE_TONES = {
  "Fruit & Veg": "produce",
  Dairy: "dairy",
  Bakery: "bakery",
  Meat: "meat",
  Pantry: "pantry",
  Snacks: "snacks",
  Frozen: "frozen",
  Household: "household",
  Toiletries: "toiletries",
  Other: "other",
};

// User-created categories fall back to a stable pick from the same palette
// (excluding "other" so they still get a colour).
const FALLBACK_TONES = [
  "produce", "dairy", "bakery", "meat", "pantry",
  "snacks", "frozen", "household", "toiletries",
];

export function aisleTone(category) {
  if (!category) return "other";
  if (AISLE_TONES[category]) return AISLE_TONES[category];

  let hash = 0;
  for (let i = 0; i < category.length; i += 1) {
    hash = (hash * 31 + category.charCodeAt(i)) >>> 0;
  }
  return FALLBACK_TONES[hash % FALLBACK_TONES.length];
}
