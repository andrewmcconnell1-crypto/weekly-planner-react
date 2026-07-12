import { useState } from "react";

import { normaliseItemName, createCollectionId } from "../utils/itemUtils";
import { canonicalKey } from "../utils/ingredientMatch";
import { createStarterInventoryItems } from "../utils/dataLoaders";
import { isPantrySubcategory } from "../utils/pantrySubcategory";
import { initialStaples } from "../data/initialStaples";

// Return the item without its pantry-subgroup override (used when the field no
// longer applies, e.g. the item left the Pantry aisle).
function stripSubcategory(item) {
  if (!("subcategory" in item)) return item;
  const rest = { ...item };
  delete rest.subcategory;
  return rest;
}

// Recurring-buy (staples) and pantry-stock (inventory) mutators, including the
// "load starters" merges and the "restore defaults" resets. Owns the two
// new-item text inputs for these lists.
export function useHouseholdActions({
  staples,
  setStaples,
  inventory,
  setInventory,
  shoppingWeekKey,
  setIngredientGroups,
  captureRecoverySnapshot,
  requestUndo,
}) {
  const [newStaple, setNewStaple] = useState("");
  const [newInventoryItem, setNewInventoryItem] = useState("");

  function addStaple(category = "Other") {
    const cleanedStaple = newStaple.trim();
    if (cleanedStaple === "") return;

    setStaples([
      ...staples,
      {
        id: createCollectionId("staple", staples, cleanedStaple),
        name: cleanedStaple,
        category: (category || "Other").trim() || "Other",
        quantity: null,
        unit: "",
        frequency: "weekly",
        startDate: shoppingWeekKey,
        active: true,
      },
    ]);

    setNewStaple("");
  }

  function deleteStaple(id) {
    const snapshot = staples;
    const removed = staples.find((staple) => staple.id === id);
    setStaples(staples.filter((staple) => staple.id !== id));
    requestUndo(
      removed?.name ? `Removed “${removed.name}”` : "Removed item",
      () => setStaples(snapshot)
    );
  }

  function updateStapleFrequency(id, frequency) {
    setStaples(
      staples.map((staple) =>
        staple.id === id ? { ...staple, frequency } : staple
      )
    );
  }

  function updateStapleCategory(id, category) {
    setStaples(
      staples.map((staple) =>
        staple.id === id ? { ...staple, category } : staple
      )
    );
  }

  function updateStapleDetails(id, updates) {
    setStaples(
      staples.map((staple) =>
        staple.id === id ? { ...staple, ...updates } : staple
      )
    );
  }

  function toggleStapleActive(id) {
    setStaples(
      staples.map((staple) =>
        staple.id === id ? { ...staple, active: !staple.active } : staple
      )
    );
  }

  function addInventoryItem(category = "Pantry", _priority, subcategory) {
    const cleanedItem = newInventoryItem.trim();

    if (cleanedItem === "") return;

    const resolvedCategory = (category || "Pantry").trim() || "Pantry";
    // Only Pantry is sub-grouped, and only a real subgroup key is worth
    // storing — everything else falls back to name-derived sorting.
    const storeSubcategory =
      resolvedCategory === "Pantry" && isPantrySubcategory(subcategory);

    setInventory([
      ...inventory,
      {
        id: createCollectionId("inventory", inventory, cleanedItem),
        name: cleanedItem,
        category: resolvedCategory,
        ...(storeSubcategory ? { subcategory } : {}),
        quantity: null,
        unit: "",
        active: true,
      },
    ]);

    setNewInventoryItem("");
  }

  // Activate a catalog item, either in stock or out of stock (out → it lands on
  // the shopping list as a restock). If it's already in the stock list, just
  // set its in/out state; otherwise add it as a new item with the catalog aisle.
  function activateStockItem(name, category = "Pantry", inStock = true) {
    const cleanedName = (name || "").trim();
    if (cleanedName === "") return;

    const normalised = normaliseItemName(cleanedName);
    const existing = inventory.find(
      (item) => normaliseItemName(item.name) === normalised
    );

    if (existing) {
      setInventory(
        inventory.map((item) =>
          item.id === existing.id ? { ...item, active: inStock } : item
        )
      );
      return;
    }

    setInventory([
      ...inventory,
      {
        id: createCollectionId("inventory", inventory, cleanedName),
        name: cleanedName,
        category: (category || "Pantry").trim() || "Pantry",
        quantity: null,
        unit: "",
        active: inStock,
      },
    ]);
  }

  function deleteInventoryItem(id) {
    const snapshot = inventory;
    const removed = inventory.find((item) => item.id === id);
    setInventory(inventory.filter((item) => item.id !== id));
    requestUndo(
      removed?.name ? `Removed “${removed.name}”` : "Removed item",
      () => setInventory(snapshot)
    );
  }

  function updateInventoryCategory(id, category) {
    setInventory(
      inventory.map((item) =>
        item.id === id
          ? // A stored subgroup only means anything for Pantry — drop it when
            // the item moves to another aisle so it can't resurface later.
            category === "Pantry"
            ? { ...item, category }
            : stripSubcategory({ ...item, category })
          : item
      )
    );
  }

  // Set or clear an item's pantry subgroup override. A blank/invalid key
  // removes the field so the subgroup falls back to being name-derived.
  function updateInventorySubcategory(id, subcategory) {
    setInventory(
      inventory.map((item) => {
        if (item.id !== id) return item;
        if (item.category === "Pantry" && isPantrySubcategory(subcategory)) {
          return { ...item, subcategory };
        }
        return stripSubcategory(item);
      })
    );
  }

  function toggleInventoryActive(id) {
    setInventory(
      inventory.map((item) =>
        item.id === id
          ? { ...item, active: item.active === false }
          : item
      )
    );
  }

  function loadStarterInventory() {
    const existingNames = inventory.map((item) =>
      normaliseItemName(item.name)
    );

    const starterItems = createStarterInventoryItems()
      .filter(
        (item) =>
          !existingNames.includes(normaliseItemName(item.name))
      );

    setInventory([...inventory, ...starterItems]);
  }

  function loadStarterStaples() {
    const existingNames = staples.map((staple) =>
      normaliseItemName(staple.name)
    );

    const starterStaples = initialStaples.filter(
      (staple) => !existingNames.includes(normaliseItemName(staple.name))
    );

    setStaples([...staples, ...starterStaples]);
  }

  function resetStockToStarterList() {
    const shouldReset = window.confirm(
      "Restore the default stock list? This removes your custom stock items and marks the default items as in stock."
    );

    if (!shouldReset) return;

    captureRecoverySnapshot("Before restoring default stock");
    setInventory(createStarterInventoryItems());
    setNewInventoryItem("");
  }

  function resetStaplesToStarterList() {
    const shouldReset = window.confirm(
      "Restore the default recurring buys? This replaces your current recurring list with the app's default weekly buys."
    );

    if (!shouldReset) return;

    captureRecoverySnapshot("Before restoring default recurring buys");
    setStaples(initialStaples.map((staple) => ({ ...staple })));
    setNewStaple("");
  }

  // Override an item's overarching group for matching. Keyed by the item's
  // canonical key, so it applies wherever that name appears (stock, recurring,
  // or a recipe). A blank group clears the override (falls back to the seed).
  function updateIngredientGroup(name, group) {
    const key = canonicalKey(name);
    if (!key) return;

    const cleaned = (group || "").trim();
    setIngredientGroups((current) => {
      const next = { ...current };
      if (cleaned === "" || canonicalKey(cleaned) === key) {
        // Blank, or "group is itself" — no override needed.
        delete next[key];
      } else {
        next[key] = cleaned;
      }
      return next;
    });
  }

  return {
    newStaple,
    setNewStaple,
    newInventoryItem,
    setNewInventoryItem,
    addStaple,
    deleteStaple,
    updateStapleFrequency,
    updateStapleCategory,
    updateStapleDetails,
    toggleStapleActive,
    loadStarterStaples,
    resetStaplesToStarterList,
    addInventoryItem,
    activateStockItem,
    deleteInventoryItem,
    updateInventoryCategory,
    updateInventorySubcategory,
    toggleInventoryActive,
    loadStarterInventory,
    resetStockToStarterList,
    updateIngredientGroup,
  };
}
