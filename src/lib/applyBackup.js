import {
  normaliseInventoryItems,
  mergeSavedRecipes,
} from "../utils/dataLoaders";

// Restore a backup, but never let an empty or missing section in the backup
// wipe data you currently have — that's how an incomplete export silently
// erased people's stock/recurring. A section is only overwritten when the
// backup actually has content for it (or you have nothing there already).
// Returns the human-readable sections that were preserved so the UI can say so.
//
// `ctx` carries the current slices, their setters, and captureRecoverySnapshot.
export function applyBackup(backup, ctx) {
  const {
    mealsByWeek,
    shoppingChecked,
    manualShoppingItems,
    settings,
    staples,
    inventory,
    recipes,
    setMealsByWeek,
    setShoppingItemsByWeek,
    setShoppingListMetaByWeek,
    setShoppingChecked,
    setManualShoppingItems,
    setSettings,
    setStaples,
    setInventory,
    setRecipes,
    captureRecoverySnapshot,
  } = ctx;

  // Save where we are first, so a bad restore can be rolled back.
  captureRecoverySnapshot("Before restoring a backup");

  const has = (key) => Object.prototype.hasOwnProperty.call(backup, key);
  const isEmpty = (value) =>
    value == null ||
    (Array.isArray(value)
      ? value.length === 0
      : typeof value === "object"
        ? Object.keys(value).length === 0
        : false);

  const kept = [];

  const apply = (key, current, setter, options = {}) => {
    const { label, transform = (value) => value } = options;
    const incomingEmpty = !has(key) || isEmpty(backup[key]);

    if (incomingEmpty) {
      // Nothing to restore here — keep whatever's already there, and flag it
      // when it's real data the user would notice losing.
      if (label && !isEmpty(current)) kept.push(label);
      return;
    }

    setter(transform(backup[key]));
  };

  apply("mealsByWeek", mealsByWeek, setMealsByWeek, { label: "meal plan" });
  apply("shoppingItemsByWeek", null, setShoppingItemsByWeek);
  apply("shoppingListMetaByWeek", null, setShoppingListMetaByWeek);
  apply("shoppingChecked", shoppingChecked, setShoppingChecked);
  apply("manualShoppingItems", manualShoppingItems, setManualShoppingItems, {
    label: "shopping list extras",
  });
  apply("settings", settings, setSettings);
  apply("staples", staples, setStaples, { label: "recurring buys" });
  // Run imported inventory / recipes through the same migration helpers the
  // app uses when loading from localStorage, so they normalise consistently.
  apply("inventory", inventory, setInventory, {
    label: "stock",
    transform: normaliseInventoryItems,
  });
  apply("recipes", recipes, setRecipes, { transform: mergeSavedRecipes });

  return { kept };
}
