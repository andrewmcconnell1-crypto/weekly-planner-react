import { describe, it, expect } from "vitest";

import {
  deriveRecipeTags,
  isQuickRecipe,
  recipeTags,
} from "./recipeUtils";

describe("deriveRecipeTags", () => {
  it("tags a meaty slow-cooked dish leftover/one-pot, not vegetarian", () => {
    const tags = deriveRecipeTags({
      name: "Beef Stew",
      category: "Slow cooker",
      ingredients: ["1kg beef chuck"],
    });
    expect(tags).toContain("Leftover-friendly");
    expect(tags).toContain("One-pot");
    expect(tags).not.toContain("Vegetarian");
  });

  it("tags a meatless dish vegetarian", () => {
    const tags = deriveRecipeTags({
      name: "Halloumi Traybake",
      category: "Vegetarian",
      ingredients: ["halloumi", "zucchini"],
    });
    expect(tags).toContain("Vegetarian");
  });

  it("tags stir-fries and noodle dishes as quick", () => {
    expect(
      deriveRecipeTags({
        name: "Chicken Stir Fry",
        category: "Chicken",
        ingredients: ["chicken"],
      })
    ).toContain("Quick");
    expect(
      deriveRecipeTags({
        name: "Pad Thai",
        category: "Noodles",
        ingredients: ["noodles", "chicken"],
      })
    ).toContain("Quick");
  });

  it("flags curries as spicy and leftover-friendly", () => {
    const tags = deriveRecipeTags({
      name: "Thai Green Curry",
      category: "Chicken",
      ingredients: ["chicken"],
    });
    expect(tags).toEqual(
      expect.arrayContaining(["Spicy", "Leftover-friendly"])
    );
  });

  it("returns tags in canonical order", () => {
    const tags = deriveRecipeTags({
      name: "Veggie Curry Stew",
      category: "Vegetarian",
      ingredients: ["lentils"],
    });
    const indexes = tags.map((tag) => recipeTags.indexOf(tag));
    expect(indexes).toEqual([...indexes].sort((a, b) => a - b));
  });
});

describe("isQuickRecipe", () => {
  it("is quick with the Quick tag", () => {
    expect(isQuickRecipe({ tags: ["Quick"], timeMins: null })).toBe(true);
  });

  it("is quick when time is at or under the threshold", () => {
    expect(isQuickRecipe({ tags: [], timeMins: 25 })).toBe(true);
    expect(isQuickRecipe({ tags: [], timeMins: 45 })).toBe(false);
  });

  it("is not quick otherwise", () => {
    expect(isQuickRecipe({ tags: ["Spicy"], timeMins: null })).toBe(false);
  });
});
