// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";

import InventoryList from "./InventoryList";

afterEach(cleanup);

// Minimal props for a single-item list with the per-row editor available.
function renderList(overrides = {}) {
  const props = {
    inventory: [{ id: "1", name: "Couscous", category: "Pantry", active: true }],
    availableCategories: ["Pantry", "Other"],
    newInventoryItem: "",
    setNewInventoryItem: () => {},
    addInventoryItem: () => {},
    deleteInventoryItem: vi.fn(),
    updateInventoryCategory: vi.fn(),
    toggleInventoryActive: () => {},
    loadStarterInventory: () => {},
    ingredientGroups: {},
    availableGroups: ["rice"],
    updateIngredientGroup: vi.fn(),
    ...overrides,
  };
  render(<InventoryList {...props} />);
  return props;
}

function openEditor() {
  // The list is collapsed by default — open the category, then the row editor.
  fireEvent.click(screen.getByRole("button", { name: /^Pantry/ }));
  fireEvent.click(screen.getByRole("button", { name: /Edit Couscous/i }));
}

describe("InventoryList row editor", () => {
  it("commits a group edit only when Save is pressed", () => {
    const { updateIngredientGroup } = renderList();
    openEditor();

    fireEvent.change(screen.getByLabelText("Couscous group"), {
      target: { value: "grains" },
    });
    // Buffered — nothing written until Save.
    expect(updateIngredientGroup).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(updateIngredientGroup).toHaveBeenCalledWith("Couscous", "grains");
  });

  it("discards edits when Cancel is pressed", () => {
    const { updateIngredientGroup, updateInventoryCategory } = renderList();
    openEditor();

    fireEvent.change(screen.getByLabelText("Couscous group"), {
      target: { value: "grains" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(updateIngredientGroup).not.toHaveBeenCalled();
    expect(updateInventoryCategory).not.toHaveBeenCalled();
    // Editor is closed again.
    expect(screen.queryByLabelText("Couscous group")).toBeNull();
  });
});
