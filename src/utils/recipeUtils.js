import { normaliseItemName } from "./itemUtils";

const categoryOrder = [
  "Chicken",
  "Beef",
  "Pasta",
  "Rice",
  "Slow cooker",
  "Mexican",
  "Noodles",
  "Vegetarian",
  "Kid-friendly",
  "Family favourites",
  "Other",
];

// The known recipe categories, used to populate category pickers.
export const recipeCategories = categoryOrder;

// Orthogonal recipe attributes (a recipe can have several), used for filtering
// and the meal-planning discovery flow. Unlike `category` (one per recipe),
// these stack — a dish can be Quick AND Kid-friendly AND Vegetarian.
export const recipeTags = [
  "Quick",
  "Kid-friendly",
  "Vegetarian",
  "Leftover-friendly",
  "One-pot",
  "Spicy",
];

// A recipe at or under this many total minutes counts as "Quick" even without
// the explicit tag.
export const QUICK_MAX_MINS = 30;

const MEAT_HINTS = [
  "chicken", "beef", "mince", "pork", "lamb", "bacon", "ham", "sausage",
  "chorizo", "prawn", "shrimp", "fish", "salmon", "tuna", "anchovy", "turkey",
  "prosciutto", "pancetta", "steak", "kofta", "veal", "duck",
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

  return recipeTags.filter((tag) => tags.has(tag));
}

export function isQuickRecipe(recipe) {
  if ((recipe.tags || []).includes("Quick")) return true;
  return recipe.timeMins != null && recipe.timeMins <= QUICK_MAX_MINS;
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
  // "Original recipes" (formerly "AI originals") share the same badge styling.
  if (source.includes("original") || source.includes("ai")) return "ai";
  return "custom";
}

export function getRecipeTone(category) {
  const normalisedCategory = normaliseItemName(category || "");

  if (normalisedCategory.includes("chicken")) return "chicken";
  if (normalisedCategory.includes("beef")) return "beef";
  if (normalisedCategory.includes("pasta")) return "pasta";
  if (normalisedCategory.includes("rice")) return "rice";
  if (normalisedCategory.includes("slow")) return "slow";
  if (normalisedCategory.includes("mexican")) return "mexican";
  if (normalisedCategory.includes("noodle")) return "noodles";
  if (normalisedCategory.includes("vegetarian")) return "vegetarian";
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
