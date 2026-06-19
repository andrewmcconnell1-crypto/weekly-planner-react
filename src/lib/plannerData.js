import { supabase } from "./supabase";
import { initialRecipes } from "../data/initialRecipes";
import {
  normaliseInventoryItems,
  mergeSavedRecipes,
  RECIPES_VERSION,
} from "../utils/dataLoaders";
import { normaliseCategory } from "../data/categories";

// Remap any retired categories (e.g. Herbs & Spices / Condiments → Pantry) on
// the saved items that carry one, leaving every other field untouched.
function migrateItemCategories(items) {
  if (!Array.isArray(items)) return [];
  return items.map((item) =>
    item && item.category
      ? { ...item, category: normaliseCategory(item.category) }
      : item
  );
}

// The slices of app state that get persisted (locally or to the cloud).
export const DATA_KEYS = [
  "mealsByWeek",
  "shoppingItemsByWeek",
  "shoppingListMetaByWeek",
  "removalAcksByWeek",
  "recurringCheckedByWeek",
  "shoppingChecked",
  "manualShoppingItems",
  "staples",
  "inventory",
  "recipes",
  "recipesVersion",
  "settings",
];

const TABLE = "app_data";

export const defaultSettings = {
  // Whether the user has a saved/standing grocery list outside the app (e.g. a
  // Woolworths or Coles saved list). Gates the per-trip "using my saved list"
  // toggle on the Shop page.
  keepStandingList: true,
  // Per-trip mode, remembered between sessions. When true ("using my saved
  // list", e.g. an online Woolies order) recurring buys stay off the buy list
  // and a "take off your saved list" section shows the ones to remove this week.
  // When false ("shopping fresh", e.g. in store or Coles) recurring buys are
  // folded into the list to buy.
  shopUsingSavedList: true,
};

function normaliseSettings(raw) {
  const value = raw && typeof raw === "object" ? raw : {};

  return {
    keepStandingList: value.keepStandingList !== false,
    shopUsingSavedList: value.shopUsingSavedList !== false,
  };
}

export function defaultData() {
  return {
    mealsByWeek: {},
    shoppingItemsByWeek: {},
    shoppingListMetaByWeek: {},
    removalAcksByWeek: {},
    recurringCheckedByWeek: {},
    shoppingChecked: {},
    manualShoppingItems: [],
    staples: [],
    inventory: [],
    recipes: initialRecipes,
    recipesVersion: RECIPES_VERSION,
    settings: { ...defaultSettings },
  };
}

// Coerce an arbitrary stored blob into the shape the app expects, running the
// same migrations used when loading from localStorage.
export function normaliseData(raw) {
  const base = defaultData();
  const data = raw && typeof raw === "object" ? raw : {};

  return {
    mealsByWeek: data.mealsByWeek ?? base.mealsByWeek,
    shoppingItemsByWeek: data.shoppingItemsByWeek ?? base.shoppingItemsByWeek,
    shoppingListMetaByWeek:
      data.shoppingListMetaByWeek ?? base.shoppingListMetaByWeek,
    removalAcksByWeek: data.removalAcksByWeek ?? base.removalAcksByWeek,
    recurringCheckedByWeek:
      data.recurringCheckedByWeek ?? base.recurringCheckedByWeek,
    shoppingChecked:
      data.shoppingChecked && typeof data.shoppingChecked === "object"
        ? data.shoppingChecked
        : base.shoppingChecked,
    manualShoppingItems: migrateItemCategories(
      Array.isArray(data.manualShoppingItems) ? data.manualShoppingItems : []
    ),
    staples: migrateItemCategories(
      Array.isArray(data.staples) ? data.staples : base.staples
    ),
    inventory: normaliseInventoryItems(
      Array.isArray(data.inventory) ? data.inventory : []
    ),
    // Refresh built-in recipes from the bundle only when the account hasn't yet
    // seen this recipe version — a one-time migration that then leaves edits be.
    recipes: mergeSavedRecipes(
      Array.isArray(data.recipes) ? data.recipes : base.recipes,
      (typeof data.recipesVersion === "number" ? data.recipesVersion : 0) <
        RECIPES_VERSION
    ),
    recipesVersion: RECIPES_VERSION,
    settings: normaliseSettings(data.settings),
  };
}

export function hasLocalData() {
  return DATA_KEYS.some((key) => localStorage.getItem(key) !== null);
}

export function loadLocalData() {
  const raw = {};

  DATA_KEYS.forEach((key) => {
    const saved = localStorage.getItem(key);
    if (saved === null) return;
    try {
      raw[key] = JSON.parse(saved);
    } catch {
      // Ignore corrupt entries; defaults fill the gap.
    }
  });

  return normaliseData(raw);
}

export function saveLocalData(data) {
  DATA_KEYS.forEach((key) => {
    localStorage.setItem(key, JSON.stringify(data[key]));
  });
}

export async function fetchCloudData(userId) {
  const { data, error } = await supabase
    .from(TABLE)
    .select("data")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return data ? data.data : null;
}

export async function saveCloudData(userId, data) {
  const updatedAt = new Date().toISOString();

  const { error } = await supabase
    .from(TABLE)
    .upsert(
      { user_id: userId, data, updated_at: updatedAt },
      { onConflict: "user_id" }
    );

  if (error) throw error;
  return updatedAt;
}
