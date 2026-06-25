import { useState } from "react";

import { normaliseItemName, createCollectionId } from "../utils/itemUtils";

// Shopping-list mutators: manual one-off adds, ticking items off, deleting
// manual items, acknowledging "take off your saved list" removals, and the two
// standing-list settings toggles. Owns the new-item text input.
export function useShoppingActions({
  manualShoppingItems,
  setManualShoppingItems,
  shoppingChecked,
  setShoppingChecked,
  unifiedItems,
  removalAcksByWeek,
  setRemovalAcksByWeek,
  currentWeekKey,
  removalIds,
  settings,
  setSettings,
  requestUndo,
}) {
  const [newItem, setNewItem] = useState("");

  // Add a one-off item to the shopping list, with a chosen category and
  // priority tier. Manual items live in their own persisted slice and show
  // independent of the plan.
  // Add (or re-prioritise) a shopping item. Manual items are explicit
  // overrides, so adding one that's already on the list moves it to the chosen
  // category/priority rather than failing. Returns "added", "updated", or false.
  function addManualShoppingItem(name, category = "Other", tier = "soon") {
    const cleanedItem = name.trim();
    if (cleanedItem === "") return false;

    const normalised = normaliseItemName(cleanedItem);
    const cleanedCategory = (category || "Other").trim() || "Other";
    const cleanedTier = tier || "soon";

    const existingManual = manualShoppingItems.find(
      (item) => normaliseItemName(item.name) === normalised
    );
    const onList = unifiedItems.some(
      (item) => normaliseItemName(item.name) === normalised
    );

    // An explicit add means "put this on my list to buy". Checked-off state is
    // keyed by item name, so clear any stale tick for this name (e.g. a
    // recurring or in-stock item of the same name that was ticked off earlier)
    // — otherwise the freshly added item would inherit it and land in Done.
    setShoppingChecked((prev) => {
      if (!prev[normalised]) return prev;
      const next = { ...prev };
      delete next[normalised];
      return next;
    });

    if (existingManual) {
      setManualShoppingItems(
        manualShoppingItems.map((item) =>
          item.id === existingManual.id
            ? { ...item, category: cleanedCategory, tier: cleanedTier }
            : item
        )
      );
    } else {
      setManualShoppingItems([
        ...manualShoppingItems,
        {
          id: createCollectionId("manual", manualShoppingItems, cleanedItem),
          name: cleanedItem,
          category: cleanedCategory,
          tier: cleanedTier,
        },
      ]);
    }

    return onList ? "updated" : "added";
  }

  function addShoppingItem(category, priority) {
    const result = addManualShoppingItem(newItem, category, priority);
    if (result) setNewItem("");
    return result;
  }

  // Override the "already have" smarts: add a skipped ingredient as a manual
  // item so it appears on the list anyway.
  function addSkippedShoppingItem(name) {
    addManualShoppingItem(name);
  }

  function deleteShoppingItem(id) {
    const snapshot = manualShoppingItems;
    const removed = manualShoppingItems.find((item) => item.id === id);
    setManualShoppingItems(
      manualShoppingItems.filter((item) => item.id !== id)
    );
    requestUndo(
      removed?.name ? `Removed “${removed.name}”` : "Removed item",
      () => setManualShoppingItems(snapshot)
    );
  }

  // Tick an item off. Keyed by item identity so the state survives the list
  // being recomputed when the plan changes.
  function toggleShoppingChecked(id) {
    setShoppingChecked({
      ...shoppingChecked,
      [id]: !shoppingChecked[id],
    });
  }

  function setKeepStandingList(value) {
    setSettings({ ...settings, keepStandingList: value });
  }

  function setUsingSavedList(value) {
    setSettings({ ...settings, shopUsingSavedList: value });
  }

  // Tick a "take off your saved list" item once handled. Kept per week and
  // pruned to removals still present, so the set can't grow stale.
  function toggleRemovalAck(id) {
    const current = (removalAcksByWeek[currentWeekKey] || []).filter((ackId) =>
      removalIds.has(ackId)
    );
    const next = current.includes(id)
      ? current.filter((ackId) => ackId !== id)
      : [...current, id];

    setRemovalAcksByWeek({ ...removalAcksByWeek, [currentWeekKey]: next });
  }

  return {
    newItem,
    setNewItem,
    addShoppingItem,
    addManualShoppingItem,
    addSkippedShoppingItem,
    deleteShoppingItem,
    toggleShoppingChecked,
    toggleRemovalAck,
    setKeepStandingList,
    setUsingSavedList,
  };
}
