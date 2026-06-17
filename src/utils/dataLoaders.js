import { normaliseItemName, slugifyIdPart } from "./itemUtils";
import { initialRecipes } from "../data/initialRecipes";
import { commonInventoryItems } from "../data/commonInventory";

const recipeIdAliases = {
  "spaghetti-bolognese": "bolognese",
  // Was mislabelled — the source recipe is just Mexican Red Rice. Migrate saved
  // copies to the corrected recipe (a proper rice-and-beans is now separate).
  "mexican-rice-and-beans": "mexican-red-rice",
};

const durableInventoryItemsByName = new Map(
  commonInventoryItems.map((item) => [normaliseItemName(item.name), item])
);

export function createStarterInventoryItems() {
  return commonInventoryItems.map((item) => ({
    id: `starter-inventory-${slugifyIdPart(item.name)}`,
    name: item.name,
    category: item.category,
    quantity: null,
    unit: "",
    active: true,
  }));
}

// Drop starter items that no longer exist in the bundled list. Preserve the
// user's own category / in-stock choices — only fall back to the bundled
// category when a (legacy) item has none stored.
export function normaliseInventoryItems(inventoryItems) {
  if (!Array.isArray(inventoryItems)) return [];

  return inventoryItems
    .filter((item) => {
      const isStarterInventoryItem = String(item.id || "").startsWith(
        "starter-inventory-"
      );
      const starterItem = durableInventoryItemsByName.get(
        normaliseItemName(item.name || "")
      );

      if (!isStarterInventoryItem) return true;

      return Boolean(starterItem);
    })
    .map((item) => {
      const starterItem = durableInventoryItemsByName.get(
        normaliseItemName(item.name || "")
      );

      return {
        ...item,
        category: item.category || starterItem?.category || "Other",
        active: item.active ?? true,
      };
    });
}

// Normalise a single saved recipe's shape (apply id aliases, ensure fields).
// Does not pull in bundled content — that's mergeSavedRecipes' job, so edits to
// built-in recipes are preserved.
function normaliseRecipe(recipe, index) {
  const recipeId = recipeIdAliases[recipe.id] || recipe.id;

  return {
    id: recipeId || `recipe-${index}-${recipe.name || "untitled"}`,
    name: recipe.name || "Untitled recipe",
    category: recipe.category || "Family favourites",
    source: recipe.source || "",
    sourceUrl: recipe.sourceUrl || "",
    ingredients: Array.isArray(recipe.ingredients) ? recipe.ingredients : [],
    method: recipe.method || "",
    serves:
      recipe.serves != null && recipe.serves !== "" ? recipe.serves : null,
  };
}

// Merge saved recipes with the bundled starter set, normalising old ids and
// appending any starter recipes the saved data is missing.
// Bumped whenever the bundled recipe content changes. normaliseData compares
// this against the account's stored recipesVersion and asks for a one-time
// refresh, so content updates reach existing accounts without permanently
// clobbering edits to built-in recipes thereafter.
export const RECIPES_VERSION = 1;

export function mergeSavedRecipes(parsedRecipes, refreshBuiltIns = false) {
  const bundledById = new Map(
    initialRecipes.map((recipe) => [recipe.id, recipe])
  );
  const normalisedRecipes = parsedRecipes.map(normaliseRecipe);
  const savedRecipeIds = new Set(normalisedRecipes.map((recipe) => recipe.id));

  const merged = normalisedRecipes.map((recipe) => {
    const bundled = bundledById.get(recipe.id);

    // A recipe you created — keep it exactly, just ensure a serves default.
    if (!bundled) return { ...recipe, serves: recipe.serves ?? 4 };

    // A built-in recipe. On the one-time refresh, take the current bundle
    // content (keeping any serves edit); otherwise keep the saved copy so your
    // edits to built-ins persist.
    if (refreshBuiltIns) {
      return { ...bundled, serves: recipe.serves ?? bundled.serves ?? 4 };
    }
    return { ...recipe, serves: recipe.serves ?? bundled.serves ?? 4 };
  });

  const missingStarterRecipes = initialRecipes
    .filter((recipe) => !savedRecipeIds.has(recipe.id))
    .map((recipe) => ({ ...recipe, serves: recipe.serves ?? 4 }));

  return [...merged, ...missingStarterRecipes];
}
