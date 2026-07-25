// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";

import MealEditorSheet from "./MealEditorSheet";
import { days } from "../utils/mealUtils";

const recipes = [
  {
    id: "r1",
    name: "Beef Tacos",
    category: "Beef",
    tags: ["Quick"],
    ingredients: ["beef mince", "tortillas"],
    method: "Cook the beef. Fill the tortillas.",
    serves: 4,
    timeMins: 25,
    source: "",
  },
  {
    id: "r2",
    name: "Lentil Dahl",
    category: "Vegetarian",
    tags: ["Vegetarian"],
    ingredients: ["lentils"],
    serves: 4,
    source: "",
  },
];

const emptyMeal = {
  name: "",
  recipeId: "",
  mealType: "cook",
  repeatFromDay: "",
  ingredients: [],
  batches: 1,
};

function setup(props = {}) {
  const updateMeal = vi.fn();
  const onClose = vi.fn();
  render(
    <MealEditorSheet
      day="Monday"
      dateLabel="Mon 6 Jul"
      meal={emptyMeal}
      days={days}
      recipes={recipes}
      recipeCoverageById={new Map()}
      linkedRecipe={null}
      weekDaySummaries={[{ day: "Monday", meal: emptyMeal, hasMeal: false }]}
      leftoverNights={1}
      maxNights={1}
      onSetNights={vi.fn()}
      onClearDay={vi.fn()}
      updateMeal={updateMeal}
      onClose={onClose}
      onFindMeals={vi.fn()}
      {...props}
    />
  );
  return { updateMeal, onClose };
}

// Open the recipe picker from the empty-day chooser.
async function openPicker(user) {
  await user.click(screen.getByRole("button", { name: /browse your recipes/i }));
}

describe("MealEditorSheet — recipe picker", () => {
  it("previews a tapped recipe instead of committing it", async () => {
    const user = userEvent.setup();
    const { updateMeal } = setup();

    await openPicker(user);
    await user.click(screen.getByRole("button", { name: /beef tacos/i }));

    // Tapping opens a preview — nothing is saved to the day yet.
    expect(updateMeal).not.toHaveBeenCalled();
    expect(
      screen.getByRole("button", { name: /plan for monday/i })
    ).toBeInTheDocument();
    // The ingredients are shown so you can explore before deciding.
    expect(screen.getByText(/beef mince/i)).toBeInTheDocument();
  });

  it("commits only when 'Plan for <day>' is pressed", async () => {
    const user = userEvent.setup();
    const { updateMeal } = setup();

    await openPicker(user);
    await user.click(screen.getByRole("button", { name: /beef tacos/i }));
    await user.click(screen.getByRole("button", { name: /plan for monday/i }));

    expect(updateMeal).toHaveBeenCalledTimes(1);
    expect(updateMeal).toHaveBeenCalledWith(
      "Monday",
      expect.objectContaining({ recipeId: "r1", name: "Beef Tacos", mealType: "cook" })
    );
  });

  it("collapses nights + batch to a summary line that expands to the controls", async () => {
    const user = userEvent.setup();
    const plannedMeal = {
      ...emptyMeal,
      name: "Beef Tacos",
      recipeId: "r1",
    };
    const { updateMeal } = setup({
      meal: plannedMeal,
      linkedRecipe: recipes[0],
      leftoverNights: 1,
      maxNights: 3,
      weekDaySummaries: [
        { day: "Monday", meal: plannedMeal, hasMeal: true, name: "Beef Tacos", label: "Chicken", tone: "beef" },
      ],
    });

    // Collapsed by default: the current picks show as one summary line, and the
    // control rows are hidden.
    expect(screen.getByText(/1 night · single batch/i)).toBeInTheDocument();
    expect(screen.queryByText("Nights")).not.toBeInTheDocument();

    // Tapping the summary reveals the controls.
    await user.click(screen.getByText(/1 night · single batch/i));
    expect(screen.getByText("Nights")).toBeInTheDocument();
    expect(screen.getByText("Batch")).toBeInTheDocument();

    await user.click(screen.getByRole("radio", { name: "×2" }));
    expect(updateMeal).toHaveBeenCalledWith(
      "Monday",
      expect.objectContaining({ batches: 2 })
    );
  });

  it("backs out of a preview without touching the day", async () => {
    const user = userEvent.setup();
    const { updateMeal } = setup();

    await openPicker(user);
    await user.click(screen.getByRole("button", { name: /beef tacos/i }));
    await user.click(screen.getByRole("button", { name: /back to recipes/i }));

    expect(updateMeal).not.toHaveBeenCalled();
    // Back on the list — both recipes are pickable again.
    expect(screen.getByRole("button", { name: /lentil dahl/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /beef tacos/i })).toBeInTheDocument();
  });
});
