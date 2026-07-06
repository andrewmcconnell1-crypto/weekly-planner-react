// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";

import RecipesList from "./RecipesList";
import { importRecipeFromUrl } from "../lib/recipeImportClient";

// Force the import UI on (it normally hides without Supabase configured) and
// stub the network call so the flow is testable.
vi.mock("../lib/recipeImportClient", () => ({
  isRecipeImportAvailable: true,
  importRecipeFromUrl: vi.fn(),
}));

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

  it("narrows by category chip from the filters sheet", async () => {
    const user = userEvent.setup();
    setup();

    // Filters now live behind a button, in a sheet.
    await user.click(screen.getByRole("button", { name: /Filters/i }));
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

  it("imports a recipe from a pasted link", async () => {
    const user = userEvent.setup();
    const parsed = {
      name: "Imported Curry",
      ingredients: ["1 onion"],
      method: "1. Cook.",
      serves: 4,
      source: "Some Blog",
      sourceUrl: "https://example.com/curry",
    };
    importRecipeFromUrl.mockResolvedValueOnce(parsed);
    const addImportedRecipe = vi.fn(() => "imported-1");
    setup({ addImportedRecipe });

    await user.click(screen.getByRole("button", { name: /New recipe/i }));
    await user.type(
      screen.getByLabelText("Recipe link to import"),
      "https://example.com/curry"
    );
    await user.click(screen.getByRole("button", { name: "Import" }));

    expect(importRecipeFromUrl).toHaveBeenCalledWith("https://example.com/curry");
    expect(addImportedRecipe).toHaveBeenCalledWith(parsed);
  });

  it("surfaces a friendly error when the import fails", async () => {
    const user = userEvent.setup();
    importRecipeFromUrl.mockRejectedValueOnce(
      new Error("No recipe found on that page — you can still add it manually.")
    );
    setup({ addImportedRecipe: vi.fn() });

    await user.click(screen.getByRole("button", { name: /New recipe/i }));
    await user.type(
      screen.getByLabelText("Recipe link to import"),
      "https://example.com/not-a-recipe"
    );
    await user.click(screen.getByRole("button", { name: "Import" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /No recipe found on that page/
    );
  });
});
