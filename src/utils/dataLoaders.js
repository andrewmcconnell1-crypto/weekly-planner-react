import { normaliseItemName, slugifyIdPart } from "./itemUtils";
import { initialRecipes } from "../data/initialRecipes";
import { commonInventoryItems } from "../data/commonInventory";

const recipeIdAliases = {
  "spaghetti-bolognese": "bolognese",
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

function normaliseRecipe(recipe, index) {
  const recipeId = recipeIdAliases[recipe.id] || recipe.id;
  const starterRecipe = initialRecipes.find(
    (initialRecipe) => initialRecipe.id === recipeId
  );

  if (starterRecipe) {
    // Starter recipes are otherwise kept in sync with the bundled set, but the
    // user's own "serves" edit is preserved.
    return recipe.serves != null && recipe.serves !== ""
      ? { ...starterRecipe, serves: recipe.serves }
      : starterRecipe;
  }

  return {
    id: recipeId || `recipe-${index}-${recipe.name || "untitled"}`,
    name: recipe.name || "Untitled recipe",
    category: recipe.category || "Family favourites",
    source: recipe.source || "",
    sourceUrl: recipe.sourceUrl || "",
    ingredients: Array.isArray(recipe.ingredients) ? recipe.ingredients : [],
    method: recipe.method || "",
    serves: recipe.serves ?? null,
  };
}

// Merge saved recipes with the bundled starter set, normalising old ids and
// appending any starter recipes the saved data is missing.
export function mergeSavedRecipes(parsedRecipes) {
  const normalisedRecipes = parsedRecipes.map(normaliseRecipe);
  const savedRecipeIds = new Set(normalisedRecipes.map((recipe) => recipe.id));
  const missingStarterRecipes = initialRecipes.filter(
    (recipe) => !savedRecipeIds.has(recipe.id)
  );

  return [...normalisedRecipes, ...missingStarterRecipes];
}
