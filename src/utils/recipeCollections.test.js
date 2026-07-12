import { describe, it, expect } from "vitest";

import { RECIPE_COLLECTIONS, collectionRecipes } from "./recipeCollections";

const byKey = Object.fromEntries(RECIPE_COLLECTIONS.map((c) => [c.key, c]));

describe("recipe collections", () => {
  it("matches Quick weeknights by tag or short time", () => {
    expect(byKey.quick.match({ tags: ["Quick"] })).toBe(true);
    expect(byKey.quick.match({ tags: [], timeMins: 20 })).toBe(true);
    expect(byKey.quick.match({ tags: [], timeMins: 90 })).toBe(false);
  });

  it("matches Veg-forward by category or tag", () => {
    expect(byKey.veg.match({ category: "Vegetarian", tags: [] })).toBe(true);
    expect(byKey.veg.match({ category: "Beef", tags: ["Vegetarian"] })).toBe(true);
    expect(byKey.veg.match({ category: "Beef", tags: [] })).toBe(false);
  });

  it("caps a collection to the limit", () => {
    const many = Array.from({ length: 30 }, (_, i) => ({
      id: `q${i}`,
      tags: ["Quick"],
    }));
    expect(collectionRecipes(many, byKey.quick, 14)).toHaveLength(14);
  });
});
