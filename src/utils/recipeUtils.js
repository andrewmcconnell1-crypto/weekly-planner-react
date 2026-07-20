import { normaliseItemName } from "./itemUtils";

const categoryOrder = [
  "Chicken",
  "Beef",
  "Pork",
  "Lamb",
  "Seafood",
  "Vegetarian",
  "Other",
];

// The known recipe categories (one per recipe — the dish's main ingredient).
export const recipeCategories = categoryOrder;

// Orthogonal recipe attributes (a recipe can have several): cooking style,
// cuisine and dietary notes. Unlike `category` (one per recipe, by main
// ingredient), these stack — a dish can be Quick AND Pasta AND Vegetarian.
export const recipeTags = [
  "Quick",
  "Kid-friendly",
  "Vegetarian",
  "Leftover-friendly",
  "One-pot",
  "Spicy",
  "Pasta",
  "Noodles",
  "Soup",
  "Mexican",
  "Slow-cooked",
];

// A recipe at or under this many total minutes counts as "Quick" even without
// the explicit tag.
export const QUICK_MAX_MINS = 30;

// Any word that means a dish contains meat or seafood — used to decide whether
// a recipe is Vegetarian. Must stay a superset of the seafood/pork/beef hint
// lists below, or a fish dish with no "common" fish word (cod, barramundi,
// scallops…) gets mislabelled Vegetarian.
const MEAT_HINTS = [
  "chicken", "beef", "mince", "pork", "lamb", "bacon", "ham", "sausage",
  "chorizo", "prawn", "shrimp", "fish", "salmon", "tuna", "anchovy", "turkey",
  "prosciutto", "pancetta", "steak", "kofta", "veal", "duck", "brisket",
  "bratwurst", "cod", "seafood", "calamari", "squid", "mussel", "scallop",
  "barramundi", "snapper", "crab", "clam",
];
const KID_HINTS = [
  "nugget", "sausage", "meatball", "mac and cheese", "macaroni", "pizza",
  "pasta bake", "taco", "burger", "fish finger", "nacho", "spaghetti",
  "parmigiana", "fajita", "bangers", "mash",
];
const QUICK_HINTS = [
  "stir fry", "stir-fry", "stirfry", "noodle", "taco", "omelette", "omelet",
  "salad", "wrap", "quesadilla", "fried rice", "carbonara", "fajita",
  "toastie", "shakshuka", "15 minute", "20 minute", "quick",
];
const LEFTOVER_HINTS = [
  "curry", "stew", "soup", "bolognese", "ragu", "lasagne", "lasagna",
  "casserole", "chilli", "chili", "dal", "dahl", "braise", "pulled", "pie",
  "risotto", "minestrone", "shepherd", "cottage",
];
const ONEPOT_HINTS = [
  "one pot", "one-pot", "one pan", "one-pan", "soup", "stew", "risotto",
  "traybake", "tray bake", "baked", "casserole", "skillet", "sheet pan",
  "sheet-pan", "minestrone", "shakshuka", "dahl", "dal",
];
const SPICY_HINTS = [
  "chilli", "chili", "curry", "jalapeno", "sriracha", "harissa", "gochujang",
  "sambal", "cajun", "spicy", "laksa", "vindaloo", "madras", "kofta",
];
const PASTA_HINTS = [
  "pasta", "spaghetti", "lasagne", "lasagna", "penne", "carbonara", "gnocchi",
  "macaroni", "fettuccine", "pappardelle", "ravioli", "rigatoni", "linguine",
  "pesto", "bolognese", "ragu",
];
const NOODLE_HINTS = [
  "noodle", "ramen", "pad thai", "lo mein", "chow mein", "udon", "soba",
  "vermicelli", "laksa",
];
const SOUP_HINTS = ["soup", "broth", "chowder", "minestrone", "bisque"];
const MEXICAN_HINTS = [
  "taco", "fajita", "quesadilla", "burrito", "nacho", "enchilada", "mexican",
];
const SLOW_HINTS = ["slow cooker", "slow-cook", "slow cook"];

// Main-ingredient detection, in priority order, for resolving a dish to its
// protein category.
const CHICKEN_HINTS = ["chicken", "turkey"];
const BEEF_HINTS = [
  "beef", "mince", "steak", "bolognese", "lasagne", "lasagna", "brisket",
];
const LAMB_HINTS = ["lamb"];
const SEAFOOD_HINTS = [
  "salmon", "fish", "prawn", "shrimp", "tuna", "cod", "seafood", "calamari",
  "squid", "mussel", "scallop", "barramundi", "snapper", "crab", "clam",
];
const PORK_HINTS = [
  "pork", "bacon", "ham", "sausage", "chorizo", "prosciutto", "pancetta",
  "bratwurst",
];

const PROTEIN_CATEGORIES = ["Chicken", "Beef", "Pork", "Lamb", "Seafood"];

// Resolve a recipe to its main-ingredient category. Protein categories pass
// through; descriptive labels (Pasta, Mexican, Soup…) are resolved to the
// dish's protein from its name + ingredients, falling back to Vegetarian when
// no meat is detected, else Other.
export function deriveMainCategory({ name = "", category = "", ingredients = [] }) {
  if (PROTEIN_CATEGORIES.includes(category)) return category;
  if (category === "Vegetarian") return "Vegetarian";

  // Stocks and sauces flavour a dish but aren't its main ingredient — strip
  // them so e.g. "chicken stock" in a sausage dish doesn't read as Chicken.
  const hay = `${name} ${ingredients.join(" ")}`
    .toLowerCase()
    .replace(/(chicken|beef|fish|vegetable) (stock|broth|bouillon|powder)/g, "")
    .replace(/(fish|oyster|worcestershire) sauce/g, "");
  const has = (words) => words.some((word) => hay.includes(word));

  if (has(CHICKEN_HINTS)) return "Chicken";
  if (has(BEEF_HINTS)) return "Beef";
  if (has(LAMB_HINTS)) return "Lamb";
  if (has(SEAFOOD_HINTS)) return "Seafood";
  if (has(PORK_HINTS)) return "Pork";
  if (!has(MEAT_HINTS)) return "Vegetarian";
  return "Other";
}

// Best-effort starter tags for a recipe from its name + category (and meat
// detection from ingredients). Deliberately conservative — it seeds the
// bundled library; users refine from there in the recipe editor.
export function deriveRecipeTags({ name = "", category = "", ingredients = [] }) {
  const nameText = String(name).toLowerCase();
  const ingredientText = ingredients.join(" ").toLowerCase();
  const inName = (hints) => hints.some((hint) => nameText.includes(hint));
  const hasMeat = MEAT_HINTS.some(
    (meat) => nameText.includes(meat) || ingredientText.includes(meat)
  );

  const tags = new Set();
  if (category === "Vegetarian" || !hasMeat) tags.add("Vegetarian");
  if (category === "Kid-friendly" || inName(KID_HINTS)) tags.add("Kid-friendly");
  if (category === "Noodles" || inName(QUICK_HINTS)) tags.add("Quick");
  if (["Slow cooker", "Soup"].includes(category) || inName(LEFTOVER_HINTS)) {
    tags.add("Leftover-friendly");
  }
  if (category === "Slow cooker" || inName(ONEPOT_HINTS)) tags.add("One-pot");
  if (inName(SPICY_HINTS)) tags.add("Spicy");

  // Style / cuisine, preserved as tags now that category is by main ingredient.
  if (category === "Pasta" || inName(PASTA_HINTS)) tags.add("Pasta");
  if (category === "Noodles" || inName(NOODLE_HINTS)) tags.add("Noodles");
  if (category === "Soup" || inName(SOUP_HINTS)) tags.add("Soup");
  if (category === "Mexican" || inName(MEXICAN_HINTS)) tags.add("Mexican");
  if (category === "Slow cooker" || inName(SLOW_HINTS)) tags.add("Slow-cooked");

  return recipeTags.filter((tag) => tags.has(tag));
}

export function isQuickRecipe(recipe) {
  if ((recipe.tags || []).includes("Quick")) return true;
  return recipe.timeMins != null && recipe.timeMins <= QUICK_MAX_MINS;
}

// Split a stored method into discrete steps for a scannable numbered list.
// Handles both newline-separated steps and a single run of "1. … 2. …".
export function parseMethodSteps(method) {
  const text = String(method || "").trim();
  if (!text) return [];
  let parts = text.split(/\n+/).map((part) => part.trim()).filter(Boolean);
  if (parts.length <= 1) {
    parts = text
      .split(/(?=\d+[.)]\s)/)
      .map((part) => part.trim())
      .filter(Boolean);
  }
  return parts.map((part) => part.replace(/^\d+[.)]\s*/, ""));
}

export function getRecipeCategory(recipe) {
  return recipe.category || "Other";
}

// A recipe's source, with a fallback for user-created recipes.
export function recipeSourceLabel(recipe) {
  return (recipe.source || "").trim() || "Custom";
}

// Coarse source bucket for badge tinting / filtering.
export function recipeSourceKind(recipe) {
  const source = (recipe.source || "").trim().toLowerCase();
  if (source.includes("recipetin")) return "rte";
  // The restaurant-quality originals get their own badge tint.
  if (source.includes("restaurant")) return "chef";
  // "Original recipes" (formerly "AI originals") share the same badge styling.
  if (source.includes("original") || source.includes("ai")) return "ai";
  return "custom";
}

// Provenance for the tile kicker: is this the app's own (or your own) recipe,
// or one adapted from an external publication? `original` drives the styling
// (accent + mark vs muted); `label` is the short kicker text. Externally-sourced
// recipes carry a real source name + link; in-house originals don't.
export function recipeProvenance(recipe) {
  const kind = recipeSourceKind(recipe);
  if (kind === "ai") return { original: true, label: "Bistro" };
  if (kind === "chef") return { original: true, label: "Bistro+" };
  if (kind === "rte") return { original: false, label: "RecipeTin Eats" };

  // "custom": a web-sourced recipe (real source name / link) vs your own.
  const source = (recipe.source || "").trim();
  const sourced =
    Boolean(recipe.sourceUrl) ||
    (source && source.toLowerCase() !== "custom");
  return sourced
    ? { original: false, label: source || "Sourced" }
    : { original: true, label: "Your recipe" };
}

export function getRecipeTone(category) {
  const normalisedCategory = normaliseItemName(category || "");

  if (normalisedCategory.includes("chicken")) return "chicken";
  if (normalisedCategory.includes("beef")) return "beef";
  if (normalisedCategory.includes("pork")) return "pork";
  if (normalisedCategory.includes("lamb")) return "lamb";
  if (normalisedCategory.includes("seafood") || normalisedCategory.includes("fish")) {
    return "seafood";
  }
  if (normalisedCategory.includes("vegetarian")) return "vegetarian";
  // Retired categories kept mapping for any older saved recipes.
  if (normalisedCategory.includes("pasta")) return "pasta";
  if (normalisedCategory.includes("rice")) return "rice";
  if (normalisedCategory.includes("slow")) return "slow";
  if (normalisedCategory.includes("mexican")) return "mexican";
  if (normalisedCategory.includes("noodle")) return "noodles";
  if (normalisedCategory.includes("kid")) return "kid";
  if (normalisedCategory.includes("family")) return "family";

  return "other";
}

export function groupRecipesByCategory(recipes) {
  const groupsByCategory = recipes.reduce((groups, recipe) => {
    const category = getRecipeCategory(recipe);

    if (!groups[category]) {
      groups[category] = [];
    }

    groups[category].push(recipe);
    return groups;
  }, {});

  return Object.entries(groupsByCategory)
    .map(([category, groupedRecipes]) => ({
      category,
      tone: getRecipeTone(category),
      recipes: [...groupedRecipes].sort((a, b) =>
        a.name.localeCompare(b.name)
      ),
    }))
    .sort((a, b) => {
      const aIndex = categoryOrder.indexOf(a.category);
      const bIndex = categoryOrder.indexOf(b.category);

      if (aIndex !== -1 || bIndex !== -1) {
        if (aIndex === -1) return 1;
        if (bIndex === -1) return -1;
        return aIndex - bIndex;
      }

      return a.category.localeCompare(b.category);
    });
}
