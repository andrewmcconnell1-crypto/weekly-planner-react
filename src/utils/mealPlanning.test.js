import { describe, it, expect } from "vitest";

import { createMealHelpers } from "./mealPlanning";

const recipes = [
  {
    id: "r1",
    name: "Beef Tacos",
    category: "Beef",
    ingredients: ["beef mince", "taco shells"],
  },
];

const { getMealSummary, getRecipeForMeal, getIngredientsForMeal } =
  createMealHelpers(recipes);

describe("createMealHelpers — getMealSummary", () => {
  it("summarises a cooked recipe meal", () => {
    const summary = getMealSummary("Monday", {
      mealType: "cook",
      recipeId: "r1",
    });

    expect(summary.hasMeal).toBe(true);
    expect(summary.name).toBe("Beef Tacos");
    expect(summary.label).toBe("Beef");
    expect(summary.tone).toBe("beef");
    expect(summary.linkedRecipe?.id).toBe("r1");
  });

  it("links a recipe by name when there is no recipeId", () => {
    const summary = getMealSummary("Monday", {
      mealType: "cook",
      name: "beef tacos",
    });

    expect(summary.linkedRecipe?.id).toBe("r1");
  });

  it("merges and de-duplicates recipe + extra ingredients", () => {
    const summary = getMealSummary("Monday", {
      mealType: "cook",
      recipeId: "r1",
      ingredients: ["Beef Mince", "lime"], // dup of recipe's "beef mince"
    });

    expect(summary.ingredients).toEqual(["beef mince", "taco shells", "lime"]);
  });

  it("handles takeaway and eating-out", () => {
    const takeaway = getMealSummary("Monday", { mealType: "takeaway" });
    expect(takeaway.name).toBe("Takeaway");
    expect(takeaway.label).toBe("No shopping needed");
    expect(takeaway.tone).toBe("takeaway");
    expect(takeaway.hasMeal).toBe(true);
    expect(takeaway.ingredients).toEqual([]);

    const out = getMealSummary("Monday", { mealType: "eating-out" });
    expect(out.name).toBe("Eating out");
    expect(out.tone).toBe("out");
  });

  it("resolves a leftovers (repeat) day from its source", () => {
    const weekMeals = {
      Monday: { mealType: "cook", recipeId: "r1" },
      Tuesday: { mealType: "repeat", repeatFromDay: "Monday" },
    };
    const summary = getMealSummary("Tuesday", weekMeals.Tuesday, weekMeals);

    expect(summary.name).toBe("Beef Tacos");
    expect(summary.label).toBe("Leftovers from Monday");
    expect(summary.tone).toBe("repeat");
    expect(summary.hasMeal).toBe(true);
  });

  it("treats a repeat with no source day as unplanned", () => {
    const summary = getMealSummary("Tuesday", { mealType: "repeat" }, {});
    expect(summary.hasMeal).toBe(false);
    expect(summary.tone).toBe("empty");
  });

  it("summarises a custom (non-recipe) cooked meal", () => {
    const summary = getMealSummary("Monday", {
      mealType: "cook",
      name: "Leftover soup",
      ingredients: ["broth"],
    });

    expect(summary.linkedRecipe).toBeNull();
    expect(summary.label).toBe("Custom meal");
    expect(summary.tone).toBe("custom");
    expect(summary.hasMeal).toBe(true);
  });

  it("treats an empty day as unplanned", () => {
    const summary = getMealSummary("Monday", undefined, {});
    expect(summary.hasMeal).toBe(false);
    expect(summary.name).toBe("No meal planned");
    expect(summary.label).toBe("Unplanned");
    expect(summary.tone).toBe("empty");
  });
});

describe("createMealHelpers — getRecipeForMeal / getIngredientsForMeal", () => {
  it("returns no recipe or ingredients for non-cook meals", () => {
    expect(getRecipeForMeal({ mealType: "takeaway", recipeId: "r1" })).toBeNull();
    expect(getIngredientsForMeal({ mealType: "takeaway" })).toEqual([]);
  });
});
