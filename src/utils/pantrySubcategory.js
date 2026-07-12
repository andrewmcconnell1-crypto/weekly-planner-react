import { tokenise, singularise } from "./categoriseIngredient";

// Display-only breakdown of the Pantry aisle for the Stock & Recurring lists.
// The shopping list still treats Pantry as one store aisle — this only
// sub-groups the management views so a long pantry list is easier to scan.
// Derived from the item name (no stored field, nothing to migrate), so a
// mis-sort simply follows the name and lands an item in "Other pantry".
//
// Checked in order; the first subcategory whose keyword set contains one of the
// name's tokens wins. Keywords are singular to match the tokenizer's output.
const PANTRY_SUBCATEGORIES = [
  {
    key: "spices",
    label: "Spices & seasoning",
    keywords: [
      "salt", "pepper", "paprika", "cumin", "coriander", "turmeric",
      "cinnamon", "herb", "chilli", "flake", "curry", "spice", "oregano",
      "nutmeg", "cardamom", "clove", "masala", "cayenne", "saffron",
      "fenugreek", "bay", "seasoning", "garlic", "stock",
    ],
  },
  {
    key: "baking",
    label: "Baking",
    keywords: ["sugar", "baking", "cocoa", "vanilla", "yeast", "icing"],
  },
  {
    key: "sauces",
    label: "Sauces, oils & condiments",
    keywords: [
      "oil", "vinegar", "sauce", "soy", "mayonnaise", "mayo", "honey",
      "ketchup", "paste", "worcestershire", "sriracha", "tahini", "pesto",
      "dressing", "syrup", "miso", "mirin", "hoisin", "oyster", "harissa",
      "chutney", "relish", "jam", "marmalade", "mustard", "peanut",
      "vegemite", "spread", "gravy",
    ],
  },
  {
    key: "canned",
    label: "Canned & jarred",
    keywords: [
      "can", "tin", "tinned", "canned", "chickpea", "bean", "tomato",
      "coconut", "tuna", "passata", "soup",
    ],
  },
  {
    key: "grains",
    label: "Grains, pasta & rice",
    keywords: [
      "rice", "pasta", "noodle", "flour", "oat", "couscous", "quinoa",
      "polenta", "breadcrumb", "cornflour", "cornstarch", "muesli", "cereal",
      "semolina", "barley", "lentil",
    ],
  },
];

const OTHER = { key: "other", label: "Other pantry" };
const ORDERED = [...PANTRY_SUBCATEGORIES, OTHER];

// The pickable subgroups, in display order, for the add/edit forms. An empty
// override falls back to deriving the subgroup from the item name.
export const PANTRY_SUBCATEGORY_OPTIONS = ORDERED.map((sub) => ({
  key: sub.key,
  label: sub.label,
}));

const VALID_KEYS = new Set(ORDERED.map((sub) => sub.key));

// True when `key` names a real pantry subgroup, so callers can validate a
// stored override before trusting it.
export function isPantrySubcategory(key) {
  return VALID_KEYS.has(key);
}

// Pre-singularise keywords so they match the tokenizer's singular output (e.g.
// "couscous" -> "couscou"), letting the lists above stay readable.
const SUBCATEGORY_SETS = PANTRY_SUBCATEGORIES.map((sub) => ({
  key: sub.key,
  keywordSet: new Set(sub.keywords.map(singularise)),
}));

// A stored `override` (set when the user picks a subgroup by hand) always wins,
// as long as it's a real subgroup; otherwise the subgroup is derived from the
// name so untouched items keep sorting themselves.
export function pantrySubcategory(name, override) {
  if (override && VALID_KEYS.has(override)) return override;

  const tokens = tokenise(name);

  for (const sub of SUBCATEGORY_SETS) {
    for (const token of tokens) {
      if (sub.keywordSet.has(token)) return sub.key;
    }
  }

  return OTHER.key;
}

// Split a category's items into ordered { key, label, items } subgroups,
// dropping empties. Only Pantry is subdivided; every other category returns a
// single unlabelled group so callers can treat the result uniformly.
export function groupBySubcategory(category, items) {
  if (category !== "Pantry") {
    return [{ key: "all", label: null, items }];
  }

  const byKey = new Map();
  for (const item of items) {
    const key = pantrySubcategory(item.name, item.subcategory);
    if (!byKey.has(key)) byKey.set(key, []);
    byKey.get(key).push(item);
  }

  return ORDERED.filter((sub) => byKey.has(sub.key)).map((sub) => ({
    key: sub.key,
    label: sub.label,
    items: byKey.get(sub.key),
  }));
}
