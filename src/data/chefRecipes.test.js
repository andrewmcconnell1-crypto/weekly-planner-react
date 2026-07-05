import { describe, expect, it } from "vitest";

import { chefRecipes } from "./chefRecipes";
import { initialRecipes } from "./initialRecipes";
import { recipeCategories, parseMethodSteps } from "../utils/recipeUtils";

describe("chefRecipes", () => {
  it("every recipe is complete: id, protein category, method steps, time", () => {
    for (const recipe of chefRecipes) {
      expect(recipe.id).toBeTruthy();
      expect(recipe.source).toBe("Restaurant quality");
      expect(recipe.sourceUrl).toBe("");
      expect(recipeCategories).toContain(recipe.category);
      expect(recipe.ingredients.length).toBeGreaterThan(4);
      expect(parseMethodSteps(recipe.method).length).toBeGreaterThan(3);
      expect(recipe.timeMins).toBeGreaterThan(0);
    }
  });

  it("is bundled into initialRecipes without id collisions", () => {
    const allIds = initialRecipes.map((recipe) => recipe.id);
    expect(new Set(allIds).size).toBe(allIds.length);

    const bundledChefIds = new Set(
      initialRecipes
        .filter((recipe) => recipe.source === "Restaurant quality")
        .map((recipe) => recipe.id)
    );
    for (const recipe of chefRecipes) {
      expect(bundledChefIds.has(recipe.id)).toBe(true);
    }
  });

  it("gets a serves default from the bundle", () => {
    const bundled = initialRecipes.filter(
      (recipe) => recipe.source === "Restaurant quality"
    );
    for (const recipe of bundled) {
      expect(recipe.serves).toBeGreaterThanOrEqual(4);
    }
  });
});
