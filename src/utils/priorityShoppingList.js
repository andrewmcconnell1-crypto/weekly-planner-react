import { buildShoppingPlan } from "./shoppingPlan";
import { categoriseIngredient } from "./categoriseIngredient";
import { normaliseItemName } from "./itemUtils";
import { days } from "./mealUtils";
import { categories } from "../data/categories";

// One shopping list spanning this week + next, ordered by urgency rather than
// split into weekly lists. Returns a flat, de-duplicated item list tagged with
// an urgency tier and an aisle, so the UI can group it either way (priority
// tiers, or one flat by-aisle list for a big shop). Reuses the tested per-week
// generator and the ingredient categoriser.

export const PRIORITY_TIERS = [
  {
    key: "soon",
    title: "Get soon",
    note: "Next day or two, restocks and anything you added.",
  },
  { key: "week", title: "This week", note: "The rest of this week's meals." },
  { key: "next", title: "Next week", note: "Lower priority — next week's meals." },
];

const TIER_RANK = { soon: 0, week: 1, next: 2 };

export function categoryRank(category) {
  const index = categories.indexOf(category);
  return index === -1 ? categories.length : index;
}

export function buildUnifiedShoppingList({
  staples,
  inventory,
  mealsByWeek,
  currentWeekKey,
  nextWeekKey,
  todayDayName,
  getMealSummary,
  keepStandingList,
  usingSavedList = false,
  manualItems = [],
  checkedMap = {},
}) {
  const todayIndex = days.indexOf(todayDayName);

  const currentPlan = buildShoppingPlan({
    staples,
    inventory,
    shoppingItems: [],
    weekMeals: mealsByWeek[currentWeekKey] || {},
    weekKey: currentWeekKey,
    getMealSummary,
  });
  const nextPlan = buildShoppingPlan({
    staples,
    inventory,
    shoppingItems: [],
    weekMeals: mealsByWeek[nextWeekKey] || {},
    weekKey: nextWeekKey,
    getMealSummary,
  });

  const collected = [];

  function add(name, category, tier, source) {
    collected.push({ name, category: category || "Other", tier, source });
  }

  // A meal's tier from how many days away it is — counted across the week
  // boundary so "tomorrow" is still urgent on a Saturday.
  function mealTier(dayName, weekOffset) {
    const dayIndex = days.indexOf(dayName);
    if (dayIndex === -1) return null;
    const daysAway = weekOffset * 7 + dayIndex - todayIndex;
    if (daysAway < 0) return null; // already passed
    if (daysAway <= 1) return "soon";
    return weekOffset === 0 ? "week" : "next";
  }

  for (const item of currentPlan.newItems) {
    if (item.source === "Meal") {
      const tier = mealTier(item.day, 0);
      if (tier) add(item.name, categoriseIngredient(item.name), tier, "Meal");
    } else if (item.source === "Restock") {
      add(item.name, item.category, "soon", "Restock");
    } else {
      add(item.name, item.category, "week", item.source);
    }
  }

  for (const item of nextPlan.newItems) {
    if (item.source === "Meal") {
      const tier = mealTier(item.day, 1) || "next";
      add(item.name, categoriseIngredient(item.name), tier, "Meal");
    }
  }

  // "Shopping fresh" (no saved list this trip) folds recurring buys into the
  // list to buy. "Using my saved list" keeps them off — they're already on the
  // saved list — and instead surfaces the ones to remove (below).
  const shoppingFresh = !keepStandingList || !usingSavedList;
  if (shoppingFresh) {
    for (const item of currentPlan.recurringBuyItems) {
      add(item.name, item.category, "week", "Recurring buy");
    }
  }

  for (const item of manualItems) {
    add(item.name, item.category || "Other", item.tier || "soon", "Manual");
  }

  // One item, one place: keep the most urgent tier if it shows up twice.
  const byName = new Map();
  for (const item of collected) {
    const id = normaliseItemName(item.name);
    const existing = byName.get(id);
    if (!existing || TIER_RANK[item.tier] < TIER_RANK[existing.tier]) {
      byName.set(id, { ...item, id, checked: Boolean(checkedMap[id]) });
    }
  }

  // Meal ingredients skipped because they're already covered by stock/recurring,
  // surfaced so the user can override. Deduped across both weeks.
  const skipped = [];
  const skippedSeen = new Set();
  for (const item of [...currentPlan.skippedItems, ...nextPlan.skippedItems]) {
    const id = normaliseItemName(item.name);
    if (skippedSeen.has(id)) continue;
    skippedSeen.add(id);
    skipped.push(item);
  }

  // When using a saved list, the recurring items to take off it this week:
  // ones you've paused, or that you're already covered for by stock.
  const removals =
    keepStandingList && usingSavedList ? currentPlan.removeFromRecurring : [];

  return { items: [...byName.values()], skipped, removals };
}

// Group items into the urgency tiers, aisle-sorted within each. Empty tiers
// are dropped.
export function groupByTier(items) {
  return PRIORITY_TIERS.map((tier) => {
    const tierItems = items.filter((item) => item.tier === tier.key);
    return { ...tier, count: tierItems.length, groups: groupByAisle(tierItems) };
  }).filter((tier) => tier.count > 0);
}

// Group items into one flat aisle list (for a single big shop).
export function groupByAisle(items) {
  const map = new Map();
  for (const item of items) {
    if (!map.has(item.category)) map.set(item.category, []);
    map.get(item.category).push(item);
  }
  return [...map.entries()]
    .sort((a, b) => categoryRank(a[0]) - categoryRank(b[0]))
    .map(([category, list]) => ({
      category,
      items: list.sort((a, b) => a.name.localeCompare(b.name)),
    }));
}
