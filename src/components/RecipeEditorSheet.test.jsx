// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";

import RecipeEditorSheet from "./RecipeEditorSheet";

afterEach(cleanup);

const recipe = {
  id: "r1",
  name: "Test dish",
  category: "Other",
  ingredients: ["2 cups jasmine rice"],
  tags: [],
};

function renderSheet(overrides = {}) {
  const props = {
    recipe,
    updateRecipe: vi.fn(),
    addIngredientToRecipe: vi.fn(),
    deleteIngredientFromRecipe: vi.fn(),
    deleteRecipe: vi.fn(),
    ingredientGroups: {},
    availableGroups: ["rice", "cheese"],
    updateIngredientGroup: vi.fn(),
    onClose: vi.fn(),
    ...overrides,
  };
  render(<RecipeEditorSheet {...props} />);
  return props;
}

describe("RecipeEditorSheet — ingredient groups", () => {
  it("sets an ingredient's group from the recipe editor", () => {
    const props = renderSheet();

    fireEvent.click(screen.getByRole("button", { name: /Edit recipe/ }));

    const input = screen.getByLabelText("Group for 2 cups jasmine rice");
    fireEvent.change(input, { target: { value: "rice" } });
    fireEvent.blur(input);

    expect(props.updateIngredientGroup).toHaveBeenCalledWith(
      "2 cups jasmine rice",
      "rice"
    );
  });

  it("prefills the current group from the seed (no override needed)", () => {
    renderSheet({
      recipe: { ...recipe, ingredients: ["1/2 cup grated parmesan"] },
    });

    fireEvent.click(screen.getByRole("button", { name: /Edit recipe/ }));

    // Parmesan is seeded under "cheese".
    expect(
      screen.getByLabelText("Group for 1/2 cup grated parmesan").value
    ).toBe("cheese");
  });
});
