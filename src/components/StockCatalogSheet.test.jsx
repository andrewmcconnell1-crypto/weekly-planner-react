// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, within } from "@testing-library/react";

import StockCatalogSheet from "./StockCatalogSheet";

afterEach(cleanup);

describe("StockCatalogSheet", () => {
  it("can add a not-yet-stocked item as in stock or out of stock", () => {
    const onActivate = vi.fn();
    render(
      <StockCatalogSheet inventory={[]} onActivate={onActivate} onClose={() => {}} />
    );

    // Search to a uniquely-named catalog item so the list is deterministic.
    fireEvent.change(screen.getByPlaceholderText(/Search common items/i), {
      target: { value: "vegemite" },
    });

    fireEvent.click(
      screen.getByRole("button", { name: /Add Vegemite as in stock/i })
    );
    expect(onActivate).toHaveBeenCalledWith("Vegemite", "Pantry", true);

    fireEvent.click(
      screen.getByRole("button", { name: /Add Vegemite as out of stock/i })
    );
    expect(onActivate).toHaveBeenCalledWith("Vegemite", "Pantry", false);
  });

  it("shows status instead of add buttons for items already in stock", () => {
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
    expect(within(row).queryByRole("button")).toBe(null);
    expect(within(row).getByText(/In stock/i)).toBeTruthy();
  });

  it("collapses aisles by default and toggles one open", () => {
    render(
      <StockCatalogSheet inventory={[]} onActivate={vi.fn()} onClose={() => {}} />
    );

    const pantryToggle = screen.getByRole("button", { name: /Pantry/ });
    expect(pantryToggle.getAttribute("aria-expanded")).toBe("false");

    fireEvent.click(pantryToggle);
    expect(pantryToggle.getAttribute("aria-expanded")).toBe("true");
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
