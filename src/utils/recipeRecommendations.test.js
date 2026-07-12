import { describe, it, expect } from "vitest";

import { recommendFromRatings } from "./recipeRecommendations";

const recipes = [
  { id: "a", name: "Chicken A", category: "Chicken", tags: ["Quick"] },
  { id: "b", name: "Chicken B", category: "Chicken", tags: ["Quick"] },
  { id: "c", name: "Beef C", category: "Beef", tags: ["Slow-cooked"] },
  { id: "d", name: "Chicken D", category: "Chicken", tags: [] },
];

describe("recommendFromRatings", () => {
  it("returns nothing when there are no high ratings", () => {
    expect(recommendFromRatings(recipes, {})).toEqual([]);
    expect(recommendFromRatings(recipes, { a: 2 })).toEqual([]);
  });

  it("suggests unrated recipes sharing the rated one's category/tags", () => {
    // Rated Chicken A (5). Should surface other chicken, quick-first.
    const recs = recommendFromRatings(recipes, { a: 5 });
    const ids = recs.map((r) => r.id);
    expect(ids).not.toContain("a"); // excludes the rated seed
    expect(ids[0]).toBe("b"); // same category + shared Quick tag ranks top
    expect(ids).toContain("d"); // same category, no shared tag, still included
    expect(ids).not.toContain("c"); // different category + tag = no overlap
  });

  it("respects the limit", () => {
    expect(recommendFromRatings(recipes, { a: 5 }, { limit: 1 })).toHaveLength(1);
  });
});
