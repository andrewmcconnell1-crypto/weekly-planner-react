import { describe, it, expect } from "vitest";

import { scaleIngredient } from "./quantityUtils";

describe("scaleIngredient", () => {
  it("returns the line unchanged for a factor of 1", () => {
    expect(scaleIngredient("2 cups flour", 1)).toBe("2 cups flour");
  });

  it("scales integers and decimals", () => {
    expect(scaleIngredient("2 cups flour", 2)).toBe("4 cups flour");
    expect(scaleIngredient("1.5 tbsp oil", 2)).toBe("3 tbsp oil");
  });

  it("scales simple and mixed fractions", () => {
    expect(scaleIngredient("1/2 cup sugar", 2)).toBe("1 cup sugar");
    expect(scaleIngredient("1 1/2 cups rice", 2)).toBe("3 cups rice");
  });

  it("scales unicode fractions, reformatting as a fraction when needed", () => {
    expect(scaleIngredient("½ tsp salt", 2)).toBe("1 tsp salt");
    expect(scaleIngredient("¼ cup milk", 2)).toBe("1/2 cup milk");
  });

  it("scales both ends of a range", () => {
    expect(scaleIngredient("2-3 cups stock", 2)).toBe("4-6 cups stock");
  });

  it("leaves lines with no leading quantity untouched", () => {
    expect(scaleIngredient("salt to taste", 2)).toBe("salt to taste");
    expect(scaleIngredient("a handful of parsley", 3)).toBe(
      "a handful of parsley"
    );
  });
});
