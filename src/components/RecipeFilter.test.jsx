// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";

import RecipeFilter from "./RecipeFilter";

describe("RecipeFilter", () => {
  it("renders nothing when there's only one real option", () => {
    const { container } = render(
      <RecipeFilter
        label="Category"
        options={["All", "Beef"]}
        active="All"
        onSelect={() => {}}
      />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders chips and reports the chosen option", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <RecipeFilter
        label="Category"
        options={["All", "Beef", "Chicken"]}
        active="All"
        onSelect={onSelect}
      />
    );

    expect(screen.getByRole("button", { name: "Beef" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Chicken" }));
    expect(onSelect).toHaveBeenCalledWith("Chicken");
  });

  it("marks the active option", () => {
    render(
      <RecipeFilter
        label="Category"
        options={["All", "Beef", "Chicken"]}
        active="Beef"
        onSelect={() => {}}
      />
    );
    expect(screen.getByRole("button", { name: "Beef" })).toHaveClass("active");
  });
});
