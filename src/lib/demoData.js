import { initialRecipes } from "../data/initialRecipes";
import { initialStaples } from "../data/initialStaples";
import { commonInventoryItems } from "../data/commonInventory";
import { createEmptyMeals, days } from "../utils/mealUtils";
import { getSunday, getNextSunday, getWeekKey } from "../utils/dateUtils";
import { createMealHelpers } from "../utils/mealPlanning";
import { buildUnifiedShoppingList } from "../utils/priorityShoppingList";
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

// A couple of finished weeks of history so the "Cooked N times" badge has
// something to show — these recipes read as already-cooked favourites.
function buildDemoPastWeek() {
  const meals = createEmptyMeals();
  meals.Monday = { ...meals.Monday, recipeId: "tacos" };
  meals.Wednesday = { ...meals.Wednesday, recipeId: "homemade-pizza" };
  meals.Saturday = { ...meals.Saturday, recipeId: "slow-cooker-pulled-pork" };
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
  const lastSunday = new Date(getSunday());
  lastSunday.setDate(lastSunday.getDate() - 7);
  const twoSundaysAgo = new Date(getSunday());
  twoSundaysAgo.setDate(twoSundaysAgo.getDate() - 14);

  const mealsByWeek = {
    [getWeekKey(twoSundaysAgo)]: buildDemoPastWeek(),
    [getWeekKey(lastSunday)]: buildDemoPastWeek(),
    [currentWeekKey]: buildDemoWeek(),
    [nextWeekKey]: buildDemoWeek(),
  };

  const staples = buildDemoStaples();
  const inventory = buildDemoInventory();
  const recipes = initialRecipes;
  const { getMealSummary } = createMealHelpers(recipes);

  // One manual add, plus a couple of items pre-ticked, so the Shop page shows a
  // populated list with some progress.
  const manualShoppingItems = [
    { id: "manual-demo-coffee", name: "Coffee", category: "Pantry" },
  ];
  const unified = buildUnifiedShoppingList({
    staples,
    inventory,
    mealsByWeek,
    currentWeekKey,
    nextWeekKey,
    todayDayName: days[new Date().getDay()],
    getMealSummary,
    keepStandingList: true,
    manualItems: manualShoppingItems,
  });
  const shoppingChecked = {};
  unified.items.slice(0, 2).forEach((item) => {
    shoppingChecked[item.id] = true;
  });

  return {
    mealsByWeek,
    shoppingItemsByWeek: {},
    shoppingListMetaByWeek: {},
    removalAcksByWeek: {},
    recurringCheckedByWeek: {},
    shoppingChecked,
    manualShoppingItems,
    staples,
    inventory,
    recipes,
    // A few hearted recipes so the Recipes tab's Favourites view has something
    // to show in the sample household.
    favouriteRecipeIds: ["tacos", "chicken-stir-fry", "homemade-pizza"],
    // A few rated so the star control and "Top rated" sort have something to show.
    recipeRatings: {
      tacos: 5,
      "homemade-pizza": 5,
      "chicken-stir-fry": 4,
      "slow-cooker-pulled-pork": 4,
    },
    recipeNotes: {
      tacos: "Double the beef and go heavy on the cumin. Kids' favourite.",
      "slow-cooker-pulled-pork":
        "Start it before work — falls apart by dinner. Great in rolls with slaw.",
    },
    settings: { keepStandingList: true, shopUsingSavedList: true },
  };
}
