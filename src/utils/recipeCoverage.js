import { buildCoverageIndex, canonicalKey, findCoverage } from "./ingredientMatch";

// Reverse planning: given what will be in the house — a chosen basket's items
// plus active recurring buys and stock — rank every recipe by how much of it
// is already covered. "Ready" cooks with nothing extra; "Almost" needs a
// couple of things; the rest need a proper shop.
//
// Quantity awareness: the app doesn't track amounts, so a basket item is
// treated as a single unit that can only cover one meal. Recipes already
// assigned to a night "claim" the basket units they use, so the same 500g of
// mince can't count as covered for four different mince recipes at once —
// as you fill the week, what's still cookable depletes. Stock and recurring
// buys are assumed always-on-hand and never deplete.

// Assumed-at-home basics that shouldn't count against a recipe.
const PANTRY_KEYS = new Set(["water", "salt", "pepper", "pepper salt"]);

export function rankRecipesByCoverage({
  recipes = [],
  basketItems = [],
  staples = [],
  inventory = [],
  ingredientGroups = {},
  plannedRecipes = [],
}) {
  // Stock + recurring buys are unlimited: they never get claimed.
  const pantryIndex = buildCoverageIndex(
    [
      ...staples
        .filter((staple) => staple.active !== false)
        .map((staple) => staple.name),
      ...inventory
        .filter((item) => item.active !== false)
        .map((item) => item.name),
    ],
    ingredientGroups
  );

  const isSkippable = (ingredient) => {
    const key = canonicalKey(ingredient);
    return !key || PANTRY_KEYS.has(key);
  };
  const inPantry = (ingredient) =>
    Boolean(findCoverage(ingredient, pantryIndex, ingredientGroups));

  // Basket items as single-use units. Recipes already on a night consume the
  // units they need (that the pantry can't already supply) so they aren't
  // available to cover anything else.
  const basketUnits = basketItems.map((name) => ({ name, used: false }));

  const claimBasketUnit = (ingredient) => {
    if (isSkippable(ingredient) || inPantry(ingredient)) return;
    const availableIndex = buildCoverageIndex(
      basketUnits.filter((unit) => !unit.used).map((unit) => unit.name),
      ingredientGroups
    );
    const coveringName = findCoverage(
      ingredient,
      availableIndex,
      ingredientGroups
    );
    if (!coveringName) return;
    const unit = basketUnits.find(
      (candidate) => !candidate.used && candidate.name === coveringName
    );
    if (unit) unit.used = true;
  };

  plannedRecipes.forEach((recipe) => {
    (recipe?.ingredients || []).forEach(claimBasketUnit);
  });

  const coverageIndex = [
    ...pantryIndex,
    ...buildCoverageIndex(
      basketUnits.filter((unit) => !unit.used).map((unit) => unit.name),
      ingredientGroups
    ),
  ];

  return recipes
    .map((recipe) => {
      const missing = (recipe.ingredients || []).filter((ingredient) => {
        if (isSkippable(ingredient)) return false;
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
