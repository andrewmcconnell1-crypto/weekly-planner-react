// Reduce an ingredient name to a set of singularised food words. Unlike the
// matcher's tokenizer (ingredientMatch) this keeps words like "cream" or
// "white" — they're qualifiers when matching products, but real food words when
// deciding an aisle.
export function singularise(word) {
  if (word.length <= 3) return word;
  if (word.endsWith("ies")) return `${word.slice(0, -3)}y`;
  if (word.endsWith("oes")) return word.slice(0, -2);
  if (word.endsWith("ss")) return word;
  if (word.endsWith("s")) return word.slice(0, -1);
  return word;
}

export function tokenise(name) {
  let text = String(name || "").toLowerCase();
  text = text.replace(/\([^)]*\)/g, " "); // drop parentheticals
  text = text.split(",")[0]; // drop prep notes after the first comma
  text = text.replace(/[^a-z\s]/g, " "); // strip digits, sizes and punctuation

  const tokens = new Set();

  for (const raw of text.split(/\s+/)) {
    if (raw.length < 2) continue;
    tokens.add(singularise(raw));
  }

  return tokens;
}

// Best-effort aisle for a free-text recipe ingredient ("500g chicken thigh
// fillets" -> "Meat"), so the full shopping list can group meal ingredients by
// supermarket section instead of a single "Meal ingredients" bucket.
//
// Ingredients are messy and categories overlap (fresh vs ground coriander,
// fresh vs canned tomato), so this is deliberately rough: reduce the name to its
// core food words and match them against per-aisle keyword sets in priority
// order. The priority order resolves the common conflicts — the spice/pantry
// forms of ambiguous words are usually kept in stock (and so suppressed before
// they ever reach here), leaving the fresh form as the likelier meaning.

// Aisles are checked in this order; the first whose keyword set contains any of
// the ingredient's core tokens wins. Categories must exist in data/categories.
const CATEGORY_KEYWORDS = [
  [
    "Meat",
    [
      "chicken", "beef", "mince", "steak", "lamb", "pork", "sausage", "bacon",
      "ham", "chorizo", "prosciutto", "salami", "pancetta", "turkey", "veal",
      "rib", "thigh", "drumstick", "schnitzel", "meatball", "rissole",
      "fish", "salmon", "tuna", "prawn", "shrimp", "squid", "calamari",
      "barramundi", "cod", "snapper", "mussel", "scallop", "crab", "fillet",
    ],
  ],
  [
    "Dairy",
    [
      "milk", "cheese", "butter", "cream", "yoghurt", "yogurt", "egg", "feta",
      "parmesan", "mozzarella", "halloumi", "ricotta", "mascarpone", "cheddar",
      "buttermilk", "custard",
    ],
  ],
  [
    "Bakery",
    [
      "bread", "roll", "bun", "tortilla", "wrap", "baguette", "naan", "pita",
      "bagel", "croissant", "brioche", "sourdough", "focaccia", "crumpet",
    ],
  ],
  [
    "Fruit & Veg",
    [
      "onion", "garlic", "tomato", "potato", "carrot", "capsicum", "broccoli",
      "spinach", "lettuce", "cucumber", "zucchini", "mushroom", "celery",
      "lemon", "lime", "lemongrass", "ginger", "chilli", "coriander", "parsley",
      "basil", "mint", "avocado", "apple", "banana", "corn", "pea", "cabbage",
      "cauliflower", "eggplant", "leek", "shallot", "spring", "kale", "rocket",
      "herb", "orange", "berry", "strawberry", "blueberry", "pumpkin", "sweet",
      "potato", "bean", "sprout", "fennel", "radish", "beetroot", "pear",
      "grape", "mango", "pineapple", "cilantro", "dill", "chive", "thyme",
      "rosemary", "sage", "watercress", "bok", "choy", "snow", "asparagus",
    ],
  ],
  [
    "Frozen",
    ["frozen", "icecream", "gelato"],
  ],
  // Everything shelf-stable lives in one Pantry aisle now — dry/canned goods,
  // the spice rack, and oils/sauces/condiments together. Checked after the
  // fresh aisles so the fresh form of an ambiguous word (e.g. coriander) wins.
  [
    "Pantry",
    [
      // Dry & canned goods
      "rice", "pasta", "noodle", "flour", "sugar", "oat", "lentil", "chickpea",
      "coconut", "stock", "breadcrumb", "cornflour", "cornstarch", "couscous",
      "quinoa", "polenta", "gelatine", "yeast", "raisin", "sultana", "almond",
      "walnut", "cashew", "peanut", "sesame", "nut", "can", "tin", "bean",
      "passata", "puree", "broth", "vanilla", "cocoa", "chocolate", "baking",
      "wine",
      // Herbs & spices
      "salt", "pepper", "paprika", "cumin", "turmeric", "cinnamon", "oregano",
      "nutmeg", "cardamom", "clove", "curry", "spice", "bay", "allspice",
      "cayenne", "masala", "saffron", "fenugreek", "mustard", "seed", "powder",
      "flake", "stick",
      // Oils, sauces & condiments
      "oil", "vinegar", "sauce", "soy", "mayonnaise", "honey", "ketchup",
      "paste", "worcestershire", "sriracha", "tahini", "pesto", "dressing",
      "syrup", "miso", "mirin", "hoisin", "oyster", "harissa", "chutney",
      "relish", "jam", "marmalade",
    ],
  ],
];

// Plant "milks" are long-life pantry items, not dairy — but the bare token
// "milk" would otherwise match Dairy first.
const PLANT_MILK_TOKENS = ["coconut", "almond", "soy", "oat", "cashew"];

// Pre-singularise the keyword sets so they match the tokenizer's singular output
// (e.g. "couscous" -> "couscou"), letting the lists above stay readable.
const CATEGORY_KEYWORD_SETS = CATEGORY_KEYWORDS.map(([category, keywords]) => [
  category,
  new Set(keywords.map(singularise)),
]);

export function categoriseIngredient(name) {
  const tokens = tokenise(name);
  if (tokens.size === 0) return "Other";

  if (
    tokens.has("milk") &&
    PLANT_MILK_TOKENS.some((token) => tokens.has(token))
  ) {
    return "Pantry";
  }

  for (const [category, keywords] of CATEGORY_KEYWORD_SETS) {
    for (const token of tokens) {
      if (keywords.has(token)) return category;
    }
  }

  return "Other";
}
