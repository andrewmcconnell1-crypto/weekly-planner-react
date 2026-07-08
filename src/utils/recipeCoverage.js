import { buildCoverageIndex, canonicalKey, findCoverage } from "./ingredientMatch";

// Reverse planning: given what will be in the house — a chosen basket's items
// plus active recurring buys and stock — rank every recipe by how much of it
// is already covered. "Ready" cooks with nothing extra; "Almost" needs a
// couple of things; the rest need a proper shop.

// Assumed-at-home basics that shouldn't count against a recipe.
const PANTRY_KEYS = new Set(["water", "salt", "pepper", "pepper salt"]);

export function rankRecipesByCoverage({
  recipes = [],
  basketItems = [],
  staples = [],
  inventory = [],
  ingredientGroups = {},
}) {
  const haveNames = [
    ...basketItems,
    ...staples
      .filter((staple) => staple.active !== false)
      .map((staple) => staple.name),
    ...inventory
      .filter((item) => item.active !== false)
      .map((item) => item.name),
  ];
  const coverageIndex = buildCoverageIndex(haveNames, ingredientGroups);

  return recipes
    .map((recipe) => {
      const missing = (recipe.ingredients || []).filter((ingredient) => {
        const key = canonicalKey(ingredient);
        if (!key || PANTRY_KEYS.has(key)) return false;
        return !findCoverage(ingredient, coverageIndex, ingredientGroups);
      });

      return {
        recipe,
        missing,
        tier:
          missing.length === 0
            ? "ready"
            : missing.length <= 2
              ? "almost"
              : "more",
      };
    })
    .sort(
      (a, b) =>
        a.missing.length - b.missing.length ||
        a.recipe.name.localeCompare(b.recipe.name)
    );
}
