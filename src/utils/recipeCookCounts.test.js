import { describe, it, expect } from "vitest";

import { countRecipeCooks } from "./recipeCookCounts";

describe("countRecipeCooks", () => {
  const meals = {
    "2026-06-28": {
      Sunday: { mealType: "cook", recipeId: "a" },
      Monday: { mealType: "repeat", repeatFromDay: "Sunday" }, // leftover, no count
      Tuesday: { mealType: "cook", recipeId: "b" },
      Wednesday: { mealType: "takeaway" }, // no recipe, no count
    },
    // current week starts 2026-07-05; today is index 3 (Wednesday)
    "2026-07-05": {
      Sunday: { mealType: "cook", recipeId: "a" }, // before today -> counts
      Wednesday: { mealType: "cook", recipeId: "a" }, // == today index, excluded
      Friday: { mealType: "cook", recipeId: "a" }, // future -> excluded
    },
    "2026-07-12": {
      Monday: { mealType: "cook", recipeId: "a" }, // future week -> excluded
    },
  };

  it("counts past cook nights plus this week before today, skipping the rest", () => {
    const counts = countRecipeCooks(meals, "2026-07-05", 3);
    expect(counts.a).toBe(2); // past Sunday + this Sunday
    expect(counts.b).toBe(1); // past Tuesday
  });

  it("ignores repeats, takeaways and empty weeks", () => {
    const counts = countRecipeCooks(
      { "2026-06-28": { Monday: { mealType: "repeat" } }, "2026-07-05": null },
      "2026-07-05",
      0
    );
    expect(counts).toEqual({});
  });
});
