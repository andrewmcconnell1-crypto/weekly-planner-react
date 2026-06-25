import { useState } from "react";

import { normaliseItemName, createCollectionId } from "../utils/itemUtils";
import { createStarterInventoryItems } from "../utils/dataLoaders";
import { initialStaples } from "../data/initialStaples";

// Recurring-buy (staples) and pantry-stock (inventory) mutators, including the
// "load starters" merges and the "restore defaults" resets. Owns the two
// new-item text inputs for these lists.
export function useHouseholdActions({
  staples,
  setStaples,
  inventory,
  setInventory,
  shoppingWeekKey,
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

  function addInventoryItem(category = "Pantry") {
    const cleanedItem = newInventoryItem.trim();

    if (cleanedItem === "") return;

    setInventory([
      ...inventory,
      {
        id: createCollectionId("inventory", inventory, cleanedItem),
        name: cleanedItem,
        category: (category || "Pantry").trim() || "Pantry",
        quantity: null,
        unit: "",
        active: true,
      },
    ]);

    setNewInventoryItem("");
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
        item.id === id ? { ...item, category } : item
      )
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
    deleteInventoryItem,
    updateInventoryCategory,
    toggleInventoryActive,
    loadStarterInventory,
    resetStockToStarterList,
  };
}
