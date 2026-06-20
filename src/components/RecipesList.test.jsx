// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";

import RecipesList from "./RecipesList";

const recipes = [
  { id: "r1", name: "Beef Tacos", category: "Beef", ingredients: [], serves: 4, source: "" },
  { id: "r2", name: "Chicken Curry", category: "Chicken", ingredients: [], serves: 4, source: "" },
];

function setup(props = {}) {
  const handlers = {
    newRecipeName: "",
    setNewRecipeName: vi.fn(),
    addRecipe: vi.fn(),
    deleteRecipe: vi.fn(),
    addIngredientToRecipe: vi.fn(),
    deleteIngredientFromRecipe: vi.fn(),
    updateRecipe: vi.fn(),
  };
  return render(<RecipesList recipes={recipes} {...handlers} {...props} />);
}

describe("RecipesList", () => {
  it("lists recipes and narrows them by search", async () => {
    const user = userEvent.setup();
    setup();

    expect(screen.getByText("Beef Tacos")).toBeInTheDocument();
    expect(screen.getByText("Chicken Curry")).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText("Search recipes..."), "beef");
    expect(screen.getByText("Beef Tacos")).toBeInTheDocument();
    expect(screen.queryByText("Chicken Curry")).not.toBeInTheDocument();
  });

  it("narrows by category chip", async () => {
    const user = userEvent.setup();
    setup();

    await user.click(screen.getByRole("button", { name: "Chicken" }));
    expect(screen.getByText("Chicken Curry")).toBeInTheDocument();
    expect(screen.queryByText("Beef Tacos")).not.toBeInTheDocument();
  });

  it("keeps the add input behind the New recipe toggle", async () => {
    const user = userEvent.setup();
    setup();

    expect(
      screen.queryByPlaceholderText("Add recipe...")
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /New recipe/i }));
    expect(screen.getByPlaceholderText("Add recipe...")).toBeInTheDocument();
  });

  it("shows a designed empty state with an add action", () => {
    setup({ recipes: [] });
    expect(screen.getByText("No recipes yet")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Add your first recipe/i })
    ).toBeInTheDocument();
  });
});
