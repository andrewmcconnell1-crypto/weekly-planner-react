// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";

import ShoppingList from "./ShoppingList";

function setup(unifiedItems) {
  const onToggleChecked = vi.fn();
  const onDeleteManual = vi.fn();

  render(
    <ShoppingList
      newItem=""
      setNewItem={vi.fn()}
      addShoppingItem={vi.fn()}
      availableCategories={["Other", "Dairy", "Meat"]}
      unifiedItems={unifiedItems}
      unifiedPending={unifiedItems.filter((i) => !i.checked).length}
      onToggleChecked={onToggleChecked}
      onDeleteManual={onDeleteManual}
      skippedItems={[]}
      onAddSkipped={vi.fn()}
      keepStandingList={false}
      usingSavedList={false}
      setUsingSavedList={vi.fn()}
      removals={[]}
      removalAckIds={[]}
      pendingRemovalCount={0}
      onToggleRemoval={vi.fn()}
      shopLayout="priority"
      setShopLayout={vi.fn()}
      onOpenHelp={vi.fn()}
    />
  );

  return { onToggleChecked, onDeleteManual };
}

describe("ShoppingList rows", () => {
  it("removes a manual item when ticked (no Done, no separate delete button)", async () => {
    const user = userEvent.setup();
    const { onToggleChecked, onDeleteManual } = setup([
      {
        id: "milk",
        name: "Milk",
        source: "Manual",
        manualId: "manual-milk",
        tier: "soon",
        category: "Dairy",
        checked: false,
      },
    ]);

    // The old per-row "Delete Milk" X button is gone.
    expect(screen.queryByLabelText(/^delete milk$/i)).toBeNull();

    await user.click(screen.getByRole("checkbox"));

    // Ticking deletes it (by its real manual id), rather than checking it off.
    // The change commits after the tick-off animation, so wait for it.
    await waitFor(() =>
      expect(onDeleteManual).toHaveBeenCalledWith("manual-milk")
    );
    expect(onToggleChecked).not.toHaveBeenCalled();
  });

  it("toggles a meal item to Done when ticked", async () => {
    const user = userEvent.setup();
    const { onToggleChecked, onDeleteManual } = setup([
      {
        id: "beef mince",
        name: "beef mince",
        source: "Meal",
        tier: "soon",
        category: "Meat",
        checked: false,
      },
    ]);

    await user.click(screen.getByRole("checkbox"));

    // The toggle to Done commits after the tick-off animation, so wait for it.
    await waitFor(() =>
      expect(onToggleChecked).toHaveBeenCalledWith("beef mince")
    );
    expect(onDeleteManual).not.toHaveBeenCalled();
  });
});
