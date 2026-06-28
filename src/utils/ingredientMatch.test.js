import { describe, it, expect } from "vitest";

import {
  buildCoverageIndex,
  findCoverage,
  isIngredientCovered,
} from "./ingredientMatch";

// Helper: is `ingredient` covered by a stock/recurring list of `have` names?
function covered(ingredient, have) {
  return isIngredientCovered(ingredient, buildCoverageIndex(have));
}

describe("ingredientMatch — exact core-token coverage", () => {
  it("does NOT treat a generic ingredient as covered by a specific product", () => {
    // The reported bug: coconut milk in stock should not cover plain milk.
    expect(covered("milk", ["Coconut milk"])).toBe(false);
    expect(covered("rice", ["Basmati rice"])).toBe(false);
    expect(covered("stock", ["Fish stock"])).toBe(false);
    expect(covered("cream", ["Coconut cream"])).toBe(false);
  });

  it("does NOT treat a specific ingredient as covered by a generic product", () => {
    expect(covered("coconut milk", ["Milk"])).toBe(false);
    expect(covered("basmati rice", ["Rice"])).toBe(false);
  });

  it("matches when the only difference is stripped qualifiers / units / quantity", () => {
    expect(covered("2 cups milk", ["Milk"])).toBe(true);
    expect(covered("1 brown onion, finely chopped", ["Onion"])).toBe(true);
    expect(covered("extra virgin olive oil", ["Olive oil"])).toBe(true);
    expect(covered("3 cloves garlic", ["Garlic"])).toBe(true);
    expect(covered("plain flour", ["Flour"])).toBe(true);
  });

  it("matches identical multi-word foods regardless of quantity/brand", () => {
    expect(covered("400g coconut milk", ["Coconut milk"])).toBe(true);
    expect(
      covered("light soy sauce", ["Woolworths Soy Sauce 500ml"])
    ).toBe(true);
  });

  it("canonicalises common regional synonyms", () => {
    expect(covered("cilantro", ["Coriander"])).toBe(true);
    expect(covered("scallions", ["Spring onion"])).toBe(true);
    expect(covered("green onions", ["Spring onion"])).toBe(true);
    expect(covered("aubergine", ["Eggplant"])).toBe(true);
    expect(covered("ground beef", ["Beef mince"])).toBe(true);
  });

  it("reports which item covered an ingredient, or null when nothing does", () => {
    const index = buildCoverageIndex(["Olive oil", "Garlic"]);
    expect(findCoverage("2 tbsp olive oil", index)).toBe("Olive oil");
    expect(findCoverage("coconut milk", index)).toBe(null);
  });

  it("never matches on empty / non-food input", () => {
    expect(covered("", ["Milk"])).toBe(false);
    expect(covered("2 cups", ["Milk"])).toBe(false);
  });
});
