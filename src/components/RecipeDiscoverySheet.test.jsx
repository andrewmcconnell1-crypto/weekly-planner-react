// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";

import RecipeDiscoverySheet from "./RecipeDiscoverySheet";

const recipes = [
  { id: "r1", name: "Beef Tacos", category: "Beef", tags: ["Quick"], ingredients: ["beef"], serves: 4, source: "" },
  { id: "r2", name: "Lentil Dahl", category: "Vegetarian", tags: ["Vegetarian", "Leftover-friendly"], ingredients: ["lentils"], serves: 4, source: "" },
];

function setup(props = {}) {
  const onAssign = vi.fn();
  const onClose = vi.fn();
  render(
    <RecipeDiscoverySheet
      recipes={recipes}
      unplannedDays={["Sunday", "Monday"]}
      plannedRecipeIds={[]}
      onAssign={onAssign}
      onClose={onClose}
      {...props}
    />
  );
  return { onAssign, onClose };
}

describe("RecipeDiscoverySheet", () => {
  it("assigns the top recipe to the next empty day on Add", async () => {
    const user = userEvent.setup();
    const { onAssign } = setup();

    expect(screen.getByText("Beef Tacos")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Add to Sunday/i }));

    await waitFor(() =>
      expect(onAssign).toHaveBeenCalledWith(
        "Sunday",
        expect.objectContaining({ id: "r1" })
      )
    );
    expect(await screen.findByText(/Added/)).toHaveTextContent("Sunday");
  });

  it("narrows the deck by tag filter", async () => {
    const user = userEvent.setup();
    setup();

    await user.click(screen.getByRole("button", { name: "Vegetarian" }));
    expect(screen.getByText("Lentil Dahl")).toBeInTheDocument();
    expect(screen.queryByText("Beef Tacos")).not.toBeInTheDocument();
  });

  it("excludes recipes already planned this week", () => {
    setup({ plannedRecipeIds: ["r1"] });
    expect(screen.queryByText("Beef Tacos")).not.toBeInTheDocument();
    expect(screen.getByText("Lentil Dahl")).toBeInTheDocument();
  });

  it("shows a 'week full' state when there are no empty days", () => {
    setup({ unplannedDays: [] });
    expect(screen.getByText("Your week's full!")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Add to/i })
    ).not.toBeInTheDocument();
  });
});
