import { describe, it, expect } from "vitest";

import { recipeImagery } from "./recipeImagery";

describe("recipeImagery", () => {
  it("uses a real photo when the recipe has an image", () => {
    const result = recipeImagery({ image: "https://x/y.jpg", category: "Beef" });
    expect(result.type).toBe("photo");
    expect(result.url).toBe("https://x/y.jpg");
  });

  it("uses a generated AI image (and keeps the emoji fallback) with no photo", () => {
    const result = recipeImagery({ name: "Roast Chicken", category: "Chicken" });
    expect(result.type).toBe("ai");
    expect(result.aiUrl).toContain("image.pollinations.ai");
    expect(result.aiUrl).toContain(encodeURIComponent("Roast Chicken"));
    expect(result.gradient).toMatch(/^linear-gradient/);
    expect(result.emoji).toBeTruthy();
  });

  it("falls back to the plain placeholder when there is no name", () => {
    const result = recipeImagery({ category: "Chicken" });
    expect(result.type).toBe("placeholder");
    expect(result.emoji).toBeTruthy();
  });

  it("gives a recipe's image a stable (cacheable) seed", () => {
    const a = recipeImagery({ name: "Beef Tacos" }).aiUrl;
    const b = recipeImagery({ name: "Beef Tacos" }).aiUrl;
    expect(a).toBe(b);
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
