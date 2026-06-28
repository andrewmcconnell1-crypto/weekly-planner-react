// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, within } from "@testing-library/react";

import StockCatalogSheet from "./StockCatalogSheet";

afterEach(cleanup);

describe("StockCatalogSheet", () => {
  it("offers + Add on items not yet in stock and activates them", () => {
    const onActivate = vi.fn();
    render(
      <StockCatalogSheet inventory={[]} onActivate={onActivate} onClose={() => {}} />
    );

    // Search to a uniquely-named catalog item so the list is deterministic.
    fireEvent.change(screen.getByPlaceholderText(/Search common items/i), {
      target: { value: "vegemite" },
    });

    const addButton = screen.getByRole("button", { name: /Add/ });
    fireEvent.click(addButton);
    expect(onActivate).toHaveBeenCalledWith("Vegemite", "Pantry");
  });

  it("shows status instead of an Add button for items already in stock", () => {
    render(
      <StockCatalogSheet
        inventory={[{ id: "1", name: "Vegemite", active: true }]}
        onActivate={vi.fn()}
        onClose={() => {}}
      />
    );

    fireEvent.change(screen.getByPlaceholderText(/Search common items/i), {
      target: { value: "vegemite" },
    });

    const row = screen.getByText("Vegemite").closest("li");
    expect(within(row).queryByRole("button", { name: /Add/ })).toBe(null);
    expect(within(row).getByText(/In stock/i)).toBeTruthy();
  });

  it("filters the list by the search text", () => {
    render(
      <StockCatalogSheet inventory={[]} onActivate={vi.fn()} onClose={() => {}} />
    );

    fireEvent.change(screen.getByPlaceholderText(/Search common items/i), {
      target: { value: "zzzznotreal" },
    });

    expect(screen.getByText(/No matching items/i)).toBeTruthy();
  });
});
