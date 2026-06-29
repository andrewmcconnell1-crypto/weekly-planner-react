import { describe, it, expect } from "vitest";

import { recipeImagery } from "./recipeImagery";

describe("recipeImagery", () => {
  it("uses a real photo when the recipe has an image", () => {
    const result = recipeImagery({ image: "https://x/y.jpg", category: "Beef" });
    expect(result.type).toBe("photo");
    expect(result.url).toBe("https://x/y.jpg");
  });

  it("falls back to a gradient + emoji placeholder with no image", () => {
    const result = recipeImagery({ name: "Roast", category: "Chicken" });
    expect(result.type).toBe("placeholder");
    expect(result.gradient).toMatch(/^linear-gradient/);
    expect(result.emoji).toBeTruthy();
  });

  it("picks a dish emoji from the name when recognisable", () => {
    expect(recipeImagery({ name: "Spaghetti Bolognese" }).emoji).toBe("🍝");
    expect(recipeImagery({ name: "Beef Tacos" }).emoji).toBe("🌮");
    expect(recipeImagery({ name: "Pumpkin Soup" }).emoji).toBe("🥣");
  });

  it("still computes the placeholder even for a photo (broken-image fallback)", () => {
    const result = recipeImagery({ image: " https://x ", name: "Pad Thai" });
    expect(result.type).toBe("photo");
    expect(result.emoji).toBe("🍜");
    expect(result.gradient).toMatch(/^linear-gradient/);
  });
});
