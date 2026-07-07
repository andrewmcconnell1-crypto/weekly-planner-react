import { describe, it, expect } from "vitest";

import {
  buildCoverageIndex,
  findCoverage,
  isIngredientCovered,
  canonicalKey,
} from "./ingredientMatch";

// Helper: is `ingredient` covered by a stock/recurring list of `have` names?
function covered(ingredient, have) {
  return isIngredientCovered(ingredient, buildCoverageIndex(have));
}

describe("ingredientMatch — exact core-token coverage", () => {
  it("does NOT treat a generic as covered by a different-food look-alike", () => {
    // The reported bug: these merely share a word, so they're never grouped and
    // must not cover each other (unlike true varieties — see the group tests).
    expect(covered("milk", ["Coconut milk"])).toBe(false);
    expect(covered("cream", ["Coconut cream"])).toBe(false);
  });

  it("does NOT treat a specific as covered by a different-food look-alike", () => {
    expect(covered("coconut milk", ["Milk"])).toBe(false);
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

  it("treats produce varieties as the base vegetable", () => {
    expect(canonicalKey("Lebanese cucumber")).toBe(canonicalKey("1 cucumber"));
    expect(canonicalKey("Truss tomatoes")).toBe(canonicalKey("2 tomatoes"));
  });

  it("canonicalises US pantry names to local ones", () => {
    expect(canonicalKey("2 tbsp cornstarch")).toBe(canonicalKey("Cornflour"));
    expect(canonicalKey("1 cup Greek yogurt")).toBe(canonicalKey("greek yoghurt"));
    expect(canonicalKey("1 red chili")).toBe(canonicalKey("red chilli"));
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

describe("ingredientMatch — group hierarchy", () => {
  it("covers a generic recipe ingredient from any variety in stock", () => {
    expect(covered("2 cups rice", ["Basmati rice"])).toBe(true);
    expect(covered("rice", ["Sushi rice"])).toBe(true);
    expect(covered("300 g pasta", ["Spaghetti"])).toBe(true);
    expect(covered("chicken stock", ["Stock cubes"])).toBe(true);
  });

  it("covers a specific recipe ingredient from the generic in stock", () => {
    expect(covered("2 cups basmati rice", ["Rice"])).toBe(true);
    expect(covered("400 g spaghetti", ["Pasta"])).toBe(true);
  });

  it("does NOT let two varieties in the same group cover each other", () => {
    expect(covered("basmati rice", ["Sushi rice"])).toBe(false);
    expect(covered("penne", ["Spaghetti"])).toBe(false);
    expect(covered("beef stock", ["Chicken stock"])).toBe(false);
  });

  it("keeps deliberately-ungrouped look-alikes apart", () => {
    // The whole reason for this work — and oils, which are separate items.
    expect(covered("milk", ["Coconut milk"])).toBe(false);
    expect(covered("olive oil", ["Vegetable oil"])).toBe(false);
  });

  it("treats broth as stock and reports the covering stock item", () => {
    expect(covered("2 cups chicken broth", ["Stock cubes"])).toBe(true);

    const index = buildCoverageIndex(["Rice"]);
    expect(findCoverage("1 cup jasmine rice", index)).toBe("Rice");
  });
});

describe("ingredientMatch — user group overrides", () => {
  function coveredWith(ingredient, have, overrides) {
    return isIngredientCovered(
      ingredient,
      buildCoverageIndex(have, overrides),
      overrides
    );
  }

  it("groups a previously-ungrouped item so the generic now matches", () => {
    // Not in the seed: spelt flour is unrelated to flour until the user says so.
    // Overrides are keyed by canonical key, exactly as updateIngredientGroup stores them.
    expect(coveredWith("flour", ["Spelt flour"], {})).toBe(false);
    expect(
      coveredWith("flour", ["Spelt flour"], {
        [canonicalKey("Spelt flour")]: "flour",
      })
    ).toBe(true);
  });

  it("lets an override win over the seed group", () => {
    // Seed groups basmati under rice; user re-points it at its own group.
    const overrides = { [canonicalKey("Basmati rice")]: "basmati rice" };
    expect(coveredWith("rice", ["Basmati rice"], overrides)).toBe(false);
  });

  it("falls back to the seed when the override is blank/missing", () => {
    expect(coveredWith("rice", ["Basmati rice"], {})).toBe(true);
  });
});
