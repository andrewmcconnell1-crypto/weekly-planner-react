import { normaliseItemName, slugifyIdPart } from "./itemUtils";
import { initialRecipes } from "../data/initialRecipes";
import { commonInventoryItems } from "../data/commonInventory";
import { normaliseCategory } from "../data/categories";

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
        category: normaliseCategory(
          item.category || starterItem?.category || "Other"
        ),
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
    tags: Array.isArray(recipe.tags) ? recipe.tags : [],
    timeMins: typeof recipe.timeMins === "number" ? recipe.timeMins : null,
  };
}

// Merge saved recipes with the bundled starter set, normalising old ids and
// appending any starter recipes the saved data is missing.
// Bumped whenever the bundled recipe content changes. normaliseData compares
// this against the account's stored recipesVersion and asks for a one-time
// refresh, so content updates reach existing accounts without permanently
// clobbering edits to built-in recipes thereafter.
// v2: bundled recipes gained tags + timeMins metadata.
// v3: recategorised by main ingredient (protein) — old style/cuisine categories
// (Pasta, Mexican, Kid-friendly…) became tags, and every bundled recipe had its
// tags re-derived. Refreshes built-ins so existing accounts pick up both.
// v4: corrected ingredient lists across the RecipeTin and web recipes (verified
// against sources), and added best-guess tags to the web recipes. Refreshes
// built-ins so existing accounts pick up the fixes.
// v5: rewrote every Original recipe's method with detailed steps (heat levels,
// timings, doneness cues) and added total-time estimates (timeMins), plus
// serving sizes for the newer originals. Refreshes built-ins so existing
// accounts pick up the richer methods.
// v6: added the "Restaurant quality" collection (chefRecipes.js) — bistro-level
// original recipes with their own source badge and filter entry.
// v7: reviewed the website-sourced recipes (webRecipes.js) and filled in missing
// or corrected core ingredients (e.g. Kung Pao's Sichuan peppercorns & black
// vinegar, curry finishes, Hainanese dipping-sauce elements).
// v8: same review for the RecipeTin Eats recipes (initialRecipes.js) — added
// defining core ingredients they were missing (butter in butter chicken, red
// wine/stock in bolognese & beef stew, curry powder in beef chow mein, etc.).
// v9: rounded out the Cajun Chicken & Rice one-pot — added the holy-trinity
// celery, thyme, bay leaf, smoked paprika, tomato paste and parsley (method too).
// v10: One Pot Cajun Beef Pasta — added garlic, tomato paste and a spring-onion
// finish (v10 also added cream, removed in v11 — that recipe isn't creamy).
// v12: matched One Pot Cajun Beef Pasta to the source list from the user — added
// carrot and kidney beans, passata -> crushed tomatoes, correct garlic/cheese.
// v13: matched Chicken Cacciatore to the source — red wine (not white), +
// chicken stock, tomato paste, bay leaves, anchovy, oregano; crushed tomatoes.
// v14: matched three more to source — Chicken Shawarma (+garlic), Chop Suey
// (+onion, cornflour, cooking wine, sesame oil), Crispy Lemon Chicken (batter
// is soda water + baking powder, not egg; +ginger, cooking wine).
// v15: Crumbed Drumsticks (real seasoning blend, 3 eggs), Hokkien Noodles
// (+capsicum, cooking wine), Golden Coconut Curry (turmeric/garam masala not
// curry powder, broccoli not spinach, +chicken stock, coriander, whole spices).
// v16: Mexican Red Rice (drop peas/carrots, +coriander), Chicken Risoni (drop
// lemon, +tomato paste/chickpeas/sun-dried tomato, breast), Mexican Chicken &
// Rice (+onion/garlic/passata/lime), Butter Chicken (+ginger/garlic/lemon/
// coriander).
// v17: Pad Thai (+onion/garlic/tofu), Portuguese Chicken & Rice (+turmeric/
// chilli/lemon), Thai Peanut Noodles (dark soy + cider vinegar, not fish sauce/
// lime; +garlic/curry powder), Vietnamese Ginger Chicken (1/3 cup ginger),
// Whipped Ricotta Pasta (+onion/garlic/tomato paste/milk).
export const RECIPES_VERSION = 17;

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

  // Guard against duplicate ids (e.g. a legacy collision in saved data): keep
  // the first of each so the UI never renders two list items with the same key.
  const seenIds = new Set();
  return [...merged, ...missingStarterRecipes].filter((recipe) => {
    if (seenIds.has(recipe.id)) return false;
    seenIds.add(recipe.id);
    return true;
  });
}
