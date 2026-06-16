import { buildShoppingPlan } from "./shoppingPlan";
import { categoriseIngredient } from "./categoriseIngredient";
import { normaliseItemName } from "./itemUtils";
import { days } from "./mealUtils";
import { categories } from "../data/categories";

// PROTOTYPE (read-only). Produces a single shopping list ordered by urgency
// rather than split into weekly lists: items for the next day or two (plus
// restocks and manual adds) float to the top, the rest of this week sits below,
// and next week's meals come last. Within each tier we still group by aisle so a
// big shop stays navigable. Reuses the tested per-week generator under the hood.

const TIER_ORDER = ["soon", "week", "next"];

const TIER_META = {
  soon: {
    title: "Get soon",
    note: "Next day or two, restocks and anything you added.",
  },
  week: { title: "This week", note: "The rest of this week's meals." },
  next: { title: "Next week", note: "Lower priority — next week's meals." },
};

function categoryRank(category) {
  const index = categories.indexOf(category);
  return index === -1 ? categories.length : index;
}

export function buildPriorityShoppingList({
  staples,
  inventory,
  mealsByWeek,
  shoppingItemsByWeek,
  currentWeekKey,
  nextWeekKey,
  todayDayName,
  getMealSummary,
  keepStandingList,
}) {
  const todayIndex = days.indexOf(todayDayName);

  const currentPlan = buildShoppingPlan({
    staples,
    inventory,
    shoppingItems: shoppingItemsByWeek[currentWeekKey] || [],
    weekMeals: mealsByWeek[currentWeekKey] || {},
    weekKey: currentWeekKey,
    getMealSummary,
  });
  const nextPlan = buildShoppingPlan({
    staples,
    inventory,
    shoppingItems: shoppingItemsByWeek[nextWeekKey] || [],
    weekMeals: mealsByWeek[nextWeekKey] || {},
    weekKey: nextWeekKey,
    getMealSummary,
  });

  const collected = [];

  function add(name, category, tier, source) {
    collected.push({ name, category: category || "Other", tier, source });
  }

  // This week's generated items, tiered by how soon the meal is.
  for (const item of currentPlan.newItems) {
    if (item.source === "Meal") {
      const dayIndex = days.indexOf(item.day);
      if (dayIndex !== -1 && dayIndex < todayIndex) continue; // already passed
      const tier =
        dayIndex === todayIndex || dayIndex === todayIndex + 1 ? "soon" : "week";
      add(item.name, categoriseIngredient(item.name), tier, "Meal");
    } else if (item.source === "Restock") {
      add(item.name, item.category, "soon", "Restock");
    } else {
      add(item.name, item.category, "week", item.source);
    }
  }

  // Manually-kept items are needed now.
  for (const item of currentPlan.retainedShoppingItems) {
    const category =
      item.category === "Meal ingredients"
        ? categoriseIngredient(item.name)
        : item.category;
    add(item.name, category, "soon", "Manual");
  }

  // Next week's meals are lowest priority. (Restocks are global, already above.)
  for (const item of nextPlan.newItems) {
    if (item.source === "Meal") {
      add(item.name, categoriseIngredient(item.name), "next", "Meal");
    }
  }

  // Recurring buys only appear when you don't keep a separate standing list.
  if (!keepStandingList) {
    for (const item of currentPlan.recurringBuyItems) {
      add(item.name, item.category, "week", "Recurring buy");
    }
  }

  // One item, one place: keep the most urgent tier if it shows up twice.
  const byName = new Map();
  for (const item of collected) {
    const key = normaliseItemName(item.name);
    const existing = byName.get(key);
    if (
      !existing ||
      TIER_ORDER.indexOf(item.tier) < TIER_ORDER.indexOf(existing.tier)
    ) {
      byName.set(key, { ...item, id: key });
    }
  }

  return TIER_ORDER.map((tierKey) => {
    const items = [...byName.values()].filter((item) => item.tier === tierKey);

    const groupsMap = new Map();
    for (const item of items) {
      if (!groupsMap.has(item.category)) groupsMap.set(item.category, []);
      groupsMap.get(item.category).push(item);
    }

    const groups = [...groupsMap.entries()]
      .sort((a, b) => categoryRank(a[0]) - categoryRank(b[0]))
      .map(([category, list]) => ({
        category,
        items: list.sort((a, b) => a.name.localeCompare(b.name)),
      }));

    return { key: tierKey, ...TIER_META[tierKey], count: items.length, groups };
  }).filter((tier) => tier.count > 0);
}
