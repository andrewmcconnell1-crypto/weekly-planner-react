// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
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
  const onSetNights = vi.fn();
  render(
    <RecipeDiscoverySheet
      recipes={recipes}
      unplannedDays={["Sunday", "Monday"]}
      plannedRecipeIds={[]}
      onAssign={onAssign}
      onSetNights={onSetNights}
      onClose={onClose}
      {...props}
    />
  );
  return { onAssign, onClose, onSetNights };
}

// The deck is now reached through a short guided question flow; skip past it to
// get to the swipe cards.
function skipWizard(user) {
  return user.click(screen.getByRole("button", { name: /skip to swiping/i }));
}

describe("RecipeDiscoverySheet", () => {
  it("assigns the top recipe to the next empty day on Add", async () => {
    const user = userEvent.setup();
    const { onAssign } = setup();

    await skipWizard(user);
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

  it("offers a leftovers nights control on the toast after adding", async () => {
    const user = userEvent.setup();
    const { onSetNights } = setup();

    await skipWizard(user);
    await user.click(screen.getByRole("button", { name: /Add to Sunday/i }));

    // Sunday + the following empty Monday → up to 2 nights.
    const group = await screen.findByRole("group", {
      name: /how many nights/i,
    });
    await user.click(within(group).getByRole("button", { name: "2" }));

    expect(onSetNights).toHaveBeenCalledWith("Sunday", 2);
  });

  it("narrows the deck by tag filter", async () => {
    const user = userEvent.setup();
    setup();

    await skipWizard(user);
    await user.click(screen.getByRole("button", { name: "Vegetarian" }));
    expect(screen.getByText("Lentil Dahl")).toBeInTheDocument();
    expect(screen.queryByText("Beef Tacos")).not.toBeInTheDocument();
  });

  it("pre-filters the deck from the guided questions", async () => {
    const user = userEvent.setup();
    setup();

    // Q1 (Quick) — no preference, Q2 (Vegetarian) — yes, then jump to the deck.
    await user.click(screen.getByRole("button", { name: "No preference" }));
    await user.click(screen.getByRole("button", { name: "Yes" }));
    await skipWizard(user);

    expect(screen.getByText("Lentil Dahl")).toBeInTheDocument();
    expect(screen.queryByText("Beef Tacos")).not.toBeInTheDocument();
  });

  it("excludes recipes already planned this week", async () => {
    const user = userEvent.setup();
    setup({ plannedRecipeIds: ["r1"] });

    await skipWizard(user);
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

  it("targets a specific day when opened from one", async () => {
    const user = userEvent.setup();
    const { onAssign } = setup({ initialDay: "Wednesday" });

    await skipWizard(user);
    expect(screen.getByText("Pick a meal for Wednesday")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Add to Wednesday/i }));

    await waitFor(() =>
      expect(onAssign).toHaveBeenCalledWith(
        "Wednesday",
        expect.objectContaining({ id: "r1" })
      )
    );
  });
});
