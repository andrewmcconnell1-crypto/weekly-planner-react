import { supabase } from "./supabase";
import { initialRecipes } from "../data/initialRecipes";
import { normaliseInventoryItems, mergeSavedRecipes } from "../utils/dataLoaders";

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
  "settings",
];

const TABLE = "app_data";

export const defaultSettings = {
  // Whether the user keeps a standing grocery list outside the app (e.g. a saved
  // Woolworths list). When true, recurring buys live on that list and the
  // generated shopping list is a "top-up" of meal ingredients + restocks. When
  // false, recurring buys are folded into one complete shopping list.
  keepStandingList: true,
};

function normaliseSettings(raw) {
  const value = raw && typeof raw === "object" ? raw : {};

  return {
    keepStandingList: value.keepStandingList !== false,
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
    manualShoppingItems: Array.isArray(data.manualShoppingItems)
      ? data.manualShoppingItems
      : base.manualShoppingItems,
    staples: Array.isArray(data.staples) ? data.staples : base.staples,
    inventory: normaliseInventoryItems(
      Array.isArray(data.inventory) ? data.inventory : []
    ),
    recipes: mergeSavedRecipes(
      Array.isArray(data.recipes) ? data.recipes : base.recipes
    ),
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
