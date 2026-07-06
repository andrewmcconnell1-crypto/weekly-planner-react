import { describe, it, expect } from "vitest";

import { recipeImagery } from "./recipeImagery";

describe("recipeImagery", () => {
  it("returns a gradient + glyph tile for a recipe", () => {
    const result = recipeImagery({ name: "Roast Chicken", category: "Chicken" });
    expect(result.gradient).toMatch(/^linear-gradient/);
    expect(result.glyph).toBeTruthy();
  });

  it("picks a dish glyph from the name when recognisable", () => {
    expect(recipeImagery({ name: "Spaghetti Bolognese" }).glyph).toBe("pastaFork");
    expect(recipeImagery({ name: "Beef Tacos" }).glyph).toBe("taco");
    expect(recipeImagery({ name: "Pumpkin Soup" }).glyph).toBe("bowlSteam");
    expect(recipeImagery({ name: "Prawn & Saffron Risotto" }).glyph).toBe("rice");
  });

  it("falls back to a tone glyph when the name gives nothing away", () => {
    expect(recipeImagery({ name: "Sunday Dinner", category: "Beef" }).glyph).toBe("steak");
  });
});
