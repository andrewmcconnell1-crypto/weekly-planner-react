import { normaliseItemName, slugifyIdPart } from "./itemUtils";
import { days } from "./mealUtils";
import { isStapleDueThisWeek } from "./stapleUtils";
import { buildCoverageIndex, findCoverage } from "./ingredientMatch";
import { scaleIngredient } from "./quantityUtils";

// Sources that the generator owns. Rows with these sources are regenerated each
// time the list is built; any other source (e.g. "Manual") is preserved.
export const generatedShoppingSources = [
  "Meal",
  "Staple",
  "Recurring buy",
  "Restock",
  "Generated",
];

export function getGeneratedShoppingSignature(items) {
  return items
    .map((item) =>
      [
        normaliseItemName(item.name || ""),
        item.category || "",
        item.source || "",
        item.sourceDetail || "",
      ].join("|")
    )
    .sort()
    .join("||");
}

export function getShoppingPlanSignature(items, removals) {
  return [
    getGeneratedShoppingSignature(items),
    getGeneratedShoppingSignature(removals),
  ].join("::remove::");
}

// Pure shopping-list generator. Given the household state for a week, returns
// the rows to keep, the rows to (re)generate, the recurring buys that are
// already covered by stock, and signatures used to detect staleness.
export function buildShoppingPlan({
  staples,
  inventory,
  shoppingItems,
  weekMeals,
  weekKey,
  getMealSummary,
  ingredientGroups = {},
}) {
  const recurringBuys = staples
    .filter(
      (staple) => staple.active !== false && isStapleDueThisWeek(staple, weekKey)
    )
    .map((staple) => ({
      id: staple.id,
      name: staple.quantity
        ? `${staple.quantity} ${staple.unit} ${staple.name}`
        : staple.name,
      category: staple.category || "Other",
      source: "Recurring buy",
      sourceDetail: staple.name,
    }));

  const restockInventory = inventory
    .filter((item) => item.active === false)
    .map((item) => ({
      name: item.quantity
        ? `${item.quantity} ${item.unit} ${item.name}`
        : item.name,
      category: item.category || "Household",
      source: "Restock",
      sourceDetail: "Stock",
      // The stock item this restocks, so ticking it off can mark it in stock.
      sourceId: item.id,
    }));

  const mealIngredients = days.flatMap((day) => {
    const daySummary = getMealSummary(day, weekMeals[day], weekMeals);
    const sourceDetail = daySummary.hasMeal ? daySummary.name : day;
    // Cooking a double (or triple) batch scales this day's ingredient amounts.
    const batches = Math.max(1, Math.round(Number(weekMeals[day]?.batches) || 1));

    return daySummary.ingredients.map((ingredient) => ({
      name: batches > 1 ? scaleIngredient(ingredient, batches) : ingredient,
      category: "Meal ingredients",
      source: "Meal",
      sourceDetail,
      day,
    }));
  });

  const recurringBuyNames = new Set(
    recurringBuys.flatMap((item) => [
      normaliseItemName(item.name),
      normaliseItemName(item.sourceDetail),
    ])
  );
  const activeStockItems = inventory.filter((item) => item.active !== false);
  const activeStockNames = new Set(
    activeStockItems.map((item) => normaliseItemName(item.name))
  );
  // Fuzzy coverage: a meal ingredient is "already covered" if its core food
  // words match anything you keep in stock or buy recurringly (active staples,
  // regardless of whether they're due this week — you have them either way).
  const coverageIndex = buildCoverageIndex(
    [
      ...activeStockItems.map((item) => item.name),
      ...staples
        .filter((staple) => staple.active !== false)
        .map((staple) => staple.name),
    ],
    ingredientGroups
  );
  // Out-of-stock items already go on the list as a "Restock" row, so a meal
  // ingredient that matches one shouldn't be added again (it would appear
  // twice — once as the restock, once as the meal ingredient).
  const restockCoverageIndex = buildCoverageIndex(
    inventory
      .filter((item) => item.active === false)
      .map((item) => item.name),
    ingredientGroups
  );
  // Recurring buys the user has switched off still sit on the standing
  // Woolworths list, so flag them for removal too (only in weeks they'd
  // otherwise be due, so fortnightly off-weeks don't nag).
  const pausedRecurring = staples
    .filter(
      (staple) =>
        staple.active === false && isStapleDueThisWeek(staple, weekKey)
    )
    .map((staple) => ({
      id: staple.id,
      name: staple.quantity
        ? `${staple.quantity} ${staple.unit} ${staple.name}`
        : staple.name,
      category: staple.category || "Other",
      source: "Woolworths list",
      sourceDetail: "Turned off",
    }));

  // Exact-name matches only: substring matching ("Rice" in stock swallowing
  // "Woolworths Microwave White Long Grain Rice 450g") flagged removals the
  // user couldn't trace, and a generic pantry item isn't the same product.
  const inStockRecurring = recurringBuys
    .filter((item) => {
      const itemName = normaliseItemName(item.name);
      const sourceName = normaliseItemName(item.sourceDetail);

      return activeStockItems.some((stockItem) => {
        const stockName = normaliseItemName(stockItem.name);

        return itemName === stockName || sourceName === stockName;
      });
    })
    .map((item) => ({
      ...item,
      source: "Woolworths list",
      sourceDetail: "Already in stock",
    }));

  const removeFromRecurring = [...inStockRecurring, ...pausedRecurring];

  const allNewItems = [...restockInventory, ...mealIngredients];

  const existingGeneratedItems = shoppingItems.filter((item) =>
    generatedShoppingSources.includes(item.source)
  );
  const retainedShoppingItems = shoppingItems.filter(
    (item) => !generatedShoppingSources.includes(item.source)
  );
  const existingGeneratedItemsByName = new Map(
    existingGeneratedItems.map((item) => [normaliseItemName(item.name), item])
  );
  const retainedNames = new Set(
    retainedShoppingItems.map((item) => normaliseItemName(item.name))
  );
  const summary = {
    mealIngredientsFound: mealIngredients.length,
    recurringBuysFound: recurringBuys.length,
    stockRestocksFound: restockInventory.length,
    mealIngredientsAdded: 0,
    stockRestocksAdded: 0,
    recurringRemovalsFound: removeFromRecurring.length,
    skippedInStock: 0,
    skippedRecurringList: 0,
    skippedDuplicates: 0,
    skippedAlreadyHave: 0,
    manualItemsKept: retainedShoppingItems.length,
  };

  const seenNames = new Set([
    ...retainedNames,
    ...activeStockNames,
    ...recurringBuyNames,
  ]);

  // Meal ingredients suppressed because you already have them — surfaced so the
  // user can review and override. Deduped by name.
  const skippedItems = [];
  const skippedSeen = new Set();

  const newItems = allNewItems
    .filter((item) => {
      const normalisedName = normaliseItemName(item.name);

      // Fuzzy coverage applies to meal ingredients only — restock rows are the
      // stock you're deliberately rebuying, so they must never be suppressed.
      if (item.source === "Meal") {
        const coveredBy = findCoverage(item.name, coverageIndex, ingredientGroups);

        if (coveredBy) {
          summary.skippedAlreadyHave += 1;

          if (!skippedSeen.has(normalisedName)) {
            skippedSeen.add(normalisedName);
            skippedItems.push({
              name: item.name,
              day: item.day || "",
              sourceDetail: item.sourceDetail || "",
              coveredBy,
            });
          }

          return false;
        }

        // Already going on the list as a "Restock" row — don't list it twice.
        if (findCoverage(item.name, restockCoverageIndex, ingredientGroups)) {
          summary.skippedDuplicates += 1;
          return false;
        }
      }

      if (seenNames.has(normalisedName)) {
        if (activeStockNames.has(normalisedName)) {
          summary.skippedInStock += 1;
        } else if (recurringBuyNames.has(normalisedName)) {
          summary.skippedRecurringList += 1;
        } else {
          summary.skippedDuplicates += 1;
        }

        return false;
      }

      seenNames.add(normalisedName);
      return true;
    })
    .map((item) => ({
      id:
        existingGeneratedItemsByName.get(normaliseItemName(item.name))?.id ||
        `generated-${slugifyIdPart(item.name)}`,
      name: item.name,
      category: item.category,
      source: item.source || "Generated",
      sourceDetail: item.sourceDetail || "",
      sourceId: item.sourceId || "",
      day: item.day || "",
      checked:
        existingGeneratedItemsByName.get(normaliseItemName(item.name))
          ?.checked || false,
    }));

  summary.mealIngredientsAdded = newItems.filter(
    (item) => item.source === "Meal"
  ).length;
  summary.stockRestocksAdded = newItems.filter(
    (item) => item.source === "Restock"
  ).length;

  // A generated row can duplicate a manually-kept row that names the same food
  // differently — e.g. an out-of-stock "Paprika" produces a "Paprika" restock
  // while a "2 tsp paprika" manual override (or hand-typed item) already sits on
  // the list. Exact-name dedup misses these because they normalise differently,
  // so drop any retained row already covered (fuzzily) by something we're
  // generating. The generated row wins: it carries the right category and the
  // "you need to buy this" meaning. Items the generator suppressed (e.g. an
  // "already have" override) have no competing row here, so they're preserved.
  const generatedCoverageIndex = buildCoverageIndex(
    newItems.map((item) => item.name),
    ingredientGroups
  );
  const dedupedRetainedItems = retainedShoppingItems.filter(
    (item) => !findCoverage(item.name, generatedCoverageIndex, ingredientGroups)
  );
  summary.manualItemsKept = dedupedRetainedItems.length;
  summary.duplicateManualDropped =
    retainedShoppingItems.length - dedupedRetainedItems.length;

  // The recurring buys that are active and due this week, as display rows. In
  // "top-up" mode these stay on the user's standing list and never hit the
  // shopping list; the "full list" view merges them in so you can shop without
  // it (e.g. in store). Derived only — never persisted as shopping rows.
  const recurringBuyItems = recurringBuys.map((item) => ({
    id: item.id,
    name: item.name,
    category: item.category,
  }));

  return {
    newItems,
    retainedShoppingItems: dedupedRetainedItems,
    removeFromRecurring,
    recurringBuyItems,
    skippedItems,
    itemsSignature: getGeneratedShoppingSignature(newItems),
    signature: getShoppingPlanSignature(newItems, removeFromRecurring),
    summary,
  };
}
