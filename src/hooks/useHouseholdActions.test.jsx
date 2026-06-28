// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";

import { useHouseholdActions } from "./useHouseholdActions";
import { canonicalKey } from "../utils/ingredientMatch";

function setup() {
  const setIngredientGroups = vi.fn();
  const { result } = renderHook(() =>
    useHouseholdActions({
      staples: [],
      setStaples: vi.fn(),
      inventory: [],
      setInventory: vi.fn(),
      shoppingWeekKey: "wk",
      setIngredientGroups,
      captureRecoverySnapshot: vi.fn(),
      requestUndo: vi.fn(),
    })
  );
  return { result, setIngredientGroups };
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
