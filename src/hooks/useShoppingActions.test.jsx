// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";

import { useShoppingActions } from "./useShoppingActions";

function setup(overrides = {}) {
  const deps = {
    manualShoppingItems: [],
    setManualShoppingItems: vi.fn(),
    shoppingChecked: {},
    setShoppingChecked: vi.fn(),
    unifiedItems: [],
    setInventory: vi.fn(),
    removalAcksByWeek: {},
    setRemovalAcksByWeek: vi.fn(),
    currentWeekKey: "wk",
    removalIds: new Set(),
    settings: {},
    setSettings: vi.fn(),
    requestUndo: vi.fn(),
    ...overrides,
  };
  const { result } = renderHook(() => useShoppingActions(deps));
  return { result, deps };
}

describe("useShoppingActions — ticking a restock row", () => {
  it("marks the linked stock item back in stock and clears the tick", () => {
    const { result, deps } = setup({
      unifiedItems: [
        { id: "milk", name: "Milk", source: "Restock", sourceId: "inv-milk" },
      ],
      shoppingChecked: { milk: true },
    });

    act(() => result.current.toggleShoppingChecked("milk"));

    expect(deps.setInventory).toHaveBeenCalledTimes(1);
    const updater = deps.setInventory.mock.calls[0][0];
    expect(
      updater([
        { id: "inv-milk", active: false },
        { id: "inv-other", active: false },
      ])
    ).toEqual([
      { id: "inv-milk", active: true },
      { id: "inv-other", active: false },
    ]);

    // The stale tick is cleared (functional updater that drops the key).
    const checkedUpdater = deps.setShoppingChecked.mock.calls[0][0];
    expect(checkedUpdater({ milk: true })).toEqual({});
  });

  it("just toggles the checked state for a normal (non-restock) row", () => {
    const { result, deps } = setup({
      unifiedItems: [{ id: "eggs", name: "Eggs", source: "Meal" }],
    });

    act(() => result.current.toggleShoppingChecked("eggs"));

    expect(deps.setInventory).not.toHaveBeenCalled();
    expect(deps.setShoppingChecked).toHaveBeenCalledWith({ eggs: true });
  });
});
