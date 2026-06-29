import { describe, it, expect } from "vitest";

import { recipeImagery } from "./recipeImagery";

describe("recipeImagery", () => {
  it("returns a gradient + emoji tile for a recipe", () => {
    const result = recipeImagery({ name: "Roast Chicken", category: "Chicken" });
    expect(result.gradient).toMatch(/^linear-gradient/);
    expect(result.emoji).toBeTruthy();
  });

  it("picks a dish emoji from the name when recognisable", () => {
    expect(recipeImagery({ name: "Spaghetti Bolognese" }).emoji).toBe("🍝");
    expect(recipeImagery({ name: "Beef Tacos" }).emoji).toBe("🌮");
    expect(recipeImagery({ name: "Pumpkin Soup" }).emoji).toBe("🥣");
  });

  it("falls back to a tone emoji when the name gives nothing away", () => {
    expect(recipeImagery({ name: "Sunday Dinner", category: "Beef" }).emoji).toBe("🥩");
  });
});
