// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";

import { useHouseholdActions } from "./useHouseholdActions";
import { canonicalKey } from "../utils/ingredientMatch";

function setup({ inventory = [] } = {}) {
  const setIngredientGroups = vi.fn();
  const setInventory = vi.fn();
  const { result } = renderHook(() =>
    useHouseholdActions({
      staples: [],
      setStaples: vi.fn(),
      inventory,
      setInventory,
      shoppingWeekKey: "wk",
      setIngredientGroups,
      captureRecoverySnapshot: vi.fn(),
      requestUndo: vi.fn(),
    })
  );
  return { result, setIngredientGroups, setInventory };
}

// Apply the functional updater the hook passes to setIngredientGroups.
function applyUpdater(setIngredientGroups, current) {
  const updater = setIngredientGroups.mock.calls.at(-1)[0];
  return updater(current);
}

describe("useHouseholdActions — updateIngredientGroup", () => {
  it("stores the override keyed by the item's canonical key", () => {
    const { result, setIngredientGroups } = setup();

    act(() => result.current.updateIngredientGroup("Basmati Rice", "rice"));

    expect(applyUpdater(setIngredientGroups, {})).toEqual({
      [canonicalKey("Basmati Rice")]: "rice",
    });
  });

  it("clears the override when the group is blank", () => {
    const { result, setIngredientGroups } = setup();
    const key = canonicalKey("Basmati Rice");

    act(() => result.current.updateIngredientGroup("Basmati Rice", "  "));

    expect(applyUpdater(setIngredientGroups, { [key]: "rice", other: "x" })).toEqual(
      { other: "x" }
    );
  });

  it("clears the override when the group is the item itself", () => {
    const { result, setIngredientGroups } = setup();
    const key = canonicalKey("Rice");

    act(() => result.current.updateIngredientGroup("Rice", "rice"));

    expect(applyUpdater(setIngredientGroups, { [key]: "rice" })).toEqual({});
  });
});

describe("useHouseholdActions — activateStockItem", () => {
  it("adds a new in-stock item with the catalog aisle", () => {
    const { result, setInventory } = setup({ inventory: [] });

    act(() => result.current.activateStockItem("Basmati Rice", "Pantry"));

    expect(setInventory).toHaveBeenCalledTimes(1);
    const added = setInventory.mock.calls[0][0];
    expect(added).toHaveLength(1);
    expect(added[0]).toMatchObject({
      name: "Basmati Rice",
      category: "Pantry",
      active: true,
    });
  });

  it("can add a new item as out of stock", () => {
    const { result, setInventory } = setup({ inventory: [] });

    act(() => result.current.activateStockItem("Olive Oil", "Pantry", false));

    const added = setInventory.mock.calls[0][0];
    expect(added[0]).toMatchObject({
      name: "Olive Oil",
      category: "Pantry",
      active: false,
    });
  });

  it("re-activates an existing out-of-stock item instead of duplicating", () => {
    const { result, setInventory } = setup({
      inventory: [{ id: "i1", name: "Milk", category: "Dairy", active: false }],
    });

    act(() => result.current.activateStockItem("milk", "Dairy"));

    expect(setInventory).toHaveBeenCalledWith([
      { id: "i1", name: "Milk", category: "Dairy", active: true },
    ]);
  });

  it("leaves an already in-stock item as a no-op re-activation", () => {
    const { result, setInventory } = setup({
      inventory: [{ id: "i1", name: "Milk", category: "Dairy", active: true }],
    });

    act(() => result.current.activateStockItem("Milk", "Dairy"));

    // Maps to the same in-stock item (no duplicate row).
    expect(setInventory).toHaveBeenCalledWith([
      { id: "i1", name: "Milk", category: "Dairy", active: true },
    ]);
  });
});
