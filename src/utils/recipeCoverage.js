import { buildCoverageIndex, canonicalKey, findCoverage } from "./ingredientMatch";
import { parseBasketQuantity } from "./basketQuantity";

// Reverse planning: given what will be in the house — a chosen basket's items
// plus active recurring buys and stock — rank every recipe by how much of it
// is already covered. "Ready" cooks with nothing extra; "Almost" needs a
// couple of things; the rest need a proper shop.
//
// Quantities are opt-in per basket line. A line with no count ("Beef mince")
// is an always-available standing buy — you rebuy it weekly, so it never runs
// out. A line with a count ("Beef mince x2") gives that many units: recipes
// already planned on a night claim the units they use, so once the count is
// spent the item stops covering further recipes. Stock and recurring buys are
// always unlimited.

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
  const parsedBasket = basketItems.map(parseBasketQuantity);

  // Unlimited pool: stock, active recurring buys, and any basket line with no
  // explicit count. These never deplete.
  const unlimitedIndex = buildCoverageIndex(
    [
      ...parsedBasket
        .filter((item) => item.quantity == null && item.name)
        .map((item) => item.name),
      ...staples
        .filter((staple) => staple.active !== false)
        .map((staple) => staple.name),
      ...inventory
        .filter((item) => item.active !== false)
        .map((item) => item.name),
    ],
    ingredientGroups
  );

  // Counted pool: one claimable unit per count.
  const countedUnits = [];
  parsedBasket
    .filter((item) => item.quantity != null && item.name)
    .forEach((item) => {
      for (let n = 0; n < item.quantity; n += 1) {
        countedUnits.push({ name: item.name, used: false });
      }
    });

  const isSkippable = (ingredient) => {
    const key = canonicalKey(ingredient);
    return !key || PANTRY_KEYS.has(key);
  };
  const inUnlimited = (ingredient) =>
    Boolean(findCoverage(ingredient, unlimitedIndex, ingredientGroups));

  // A planned recipe claims one counted unit per ingredient the unlimited pool
  // can't already supply.
  const claimUnit = (ingredient) => {
    if (isSkippable(ingredient) || inUnlimited(ingredient)) return;
    const availableIndex = buildCoverageIndex(
      countedUnits.filter((unit) => !unit.used).map((unit) => unit.name),
      ingredientGroups
    );
    const coveringName = findCoverage(
      ingredient,
      availableIndex,
      ingredientGroups
    );
    if (!coveringName) return;
    const unit = countedUnits.find(
      (candidate) => !candidate.used && candidate.name === coveringName
    );
    if (unit) unit.used = true;
  };

  plannedRecipes.forEach((recipe) => {
    (recipe?.ingredients || []).forEach(claimUnit);
  });

  const coverageIndex = [
    ...unlimitedIndex,
    ...buildCoverageIndex(
      countedUnits.filter((unit) => !unit.used).map((unit) => unit.name),
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
