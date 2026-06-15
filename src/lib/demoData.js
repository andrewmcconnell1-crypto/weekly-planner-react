import { initialRecipes } from "../data/initialRecipes";
import { initialStaples } from "../data/initialStaples";
import { commonInventoryItems } from "../data/commonInventory";
import { createEmptyMeals } from "../utils/mealUtils";
import { getSunday, getNextSunday, getWeekKey } from "../utils/dateUtils";
import { createMealHelpers } from "../utils/mealPlanning";
import { buildShoppingPlan } from "../utils/shoppingPlan";
import { slugifyIdPart } from "../utils/itemUtils";

// A populated sample household for "Explore without an account", so a newcomer
// sees the app in use — a planned week, a generated list, stock and recurring
// buys — instead of a blank canvas. Built fresh and held in memory only (never
// persisted), so it can't leak into a real account. See usePlannerStore.

// A few stock staples deliberately out of stock, so Stock shows a "Missing"
// count and these appear as restocks on the shopping list.
const OUT_OF_STOCK = new Set(["Paprika", "Olive Oil", "Tomato Paste"]);
// A couple of recurring buys switched off, to show the "remove from your
// standing list" flow on the Shop page.
const RECURRING_OFF = new Set(["staple-21", "staple-22"]);

// One week's plan: a cook-once-eat-twice run, a couple of weeknight cooks, a
// takeaway and a night out — enough to show every meal type at a glance.
function buildDemoWeek() {
  const meals = createEmptyMeals();

  meals.Sunday = {
    ...meals.Sunday,
    recipeId: "slow-cooker-pulled-pork",
  };
  meals.Monday = { ...meals.Monday, mealType: "repeat", repeatFromDay: "Sunday" };
  meals.Tuesday = { ...meals.Tuesday, recipeId: "tacos" };
  meals.Wednesday = { ...meals.Wednesday, recipeId: "chicken-stir-fry" };
  meals.Thursday = { ...meals.Thursday, mealType: "takeaway" };
  meals.Friday = { ...meals.Friday, recipeId: "homemade-pizza" };
  meals.Saturday = { ...meals.Saturday, mealType: "eating-out" };

  return meals;
}

function buildDemoInventory() {
  return commonInventoryItems.map((item) => ({
    id: `demo-stock-${slugifyIdPart(item.name)}`,
    name: item.name,
    category: item.category,
    active: !OUT_OF_STOCK.has(item.name),
  }));
}

function buildDemoStaples() {
  return initialStaples.map((staple) => ({
    ...staple,
    active: !RECURRING_OFF.has(staple.id),
  }));
}

export function demoData() {
  const currentWeekKey = getWeekKey(getSunday());
  const nextWeekKey = getWeekKey(getNextSunday());

  const mealsByWeek = {
    [currentWeekKey]: buildDemoWeek(),
    [nextWeekKey]: buildDemoWeek(),
  };

  const staples = buildDemoStaples();
  const inventory = buildDemoInventory();
  const recipes = initialRecipes;
  const { getMealSummary } = createMealHelpers(recipes);

  // Pre-generate the shopping list for both weeks (reusing the real generator),
  // with a few items already ticked so the Shop page shows progress.
  const shoppingItemsByWeek = {};
  const shoppingListMetaByWeek = {};
  const generatedAt = new Date().toISOString();

  for (const weekKey of [currentWeekKey, nextWeekKey]) {
    const plan = buildShoppingPlan({
      staples,
      inventory,
      shoppingItems: [],
      weekMeals: mealsByWeek[weekKey],
      weekKey,
      getMealSummary,
    });

    shoppingItemsByWeek[weekKey] = [
      ...plan.retainedShoppingItems,
      ...plan.newItems,
    ].map((item, index) =>
      index % 4 === 0 ? { ...item, checked: true } : item
    );
    shoppingListMetaByWeek[weekKey] = { signature: plan.signature, generatedAt };
  }

  return {
    mealsByWeek,
    shoppingItemsByWeek,
    shoppingListMetaByWeek,
    removalAcksByWeek: {},
    recurringCheckedByWeek: {},
    staples,
    inventory,
    recipes,
    settings: { keepStandingList: true },
  };
}
