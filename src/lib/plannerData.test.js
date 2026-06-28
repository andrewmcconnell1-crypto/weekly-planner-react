import { describe, it, expect } from "vitest";

import { normaliseData } from "./plannerData";
import { RECIPES_VERSION } from "../utils/dataLoaders";

describe("normaliseData", () => {
  it("returns sane defaults for garbage input", () => {
    const data = normaliseData(null);
    expect(data.staples).toEqual([]);
    expect(data.inventory).toEqual([]);
    expect(data.manualShoppingItems).toEqual([]);
    expect(data.recipesVersion).toBe(RECIPES_VERSION);
    expect(data.settings).toEqual({
      keepStandingList: true,
      shopUsingSavedList: true,
    });
  });

  it("coerces non-array slices back to arrays", () => {
    const data = normaliseData({ staples: "nope", manualShoppingItems: 5 });
    expect(data.staples).toEqual([]);
    expect(data.manualShoppingItems).toEqual([]);
  });

  it("migrates retired categories across staples, stock and manual items", () => {
    const data = normaliseData({
      staples: [{ id: "s1", name: "Salt", category: "Herbs & Spices" }],
      inventory: [{ id: "i1", name: "Olive Oil", category: "Condiments" }],
      manualShoppingItems: [{ name: "Coffee", category: "Condiments" }],
    });

    expect(data.staples[0].category).toBe("Pantry");
    expect(data.inventory[0].category).toBe("Pantry");
    expect(data.manualShoppingItems[0].category).toBe("Pantry");
  });

  it("normalises settings, treating explicit false as false", () => {
    const data = normaliseData({
      settings: { keepStandingList: false, shopUsingSavedList: false },
    });
    expect(data.settings).toEqual({
      keepStandingList: false,
      shopUsingSavedList: false,
    });
  });

  it("defaults ingredientGroups to an object and coerces non-objects", () => {
    expect(normaliseData(null).ingredientGroups).toEqual({});
    expect(normaliseData({ ingredientGroups: "nope" }).ingredientGroups).toEqual(
      {}
    );

    const overrides = { "basmati rice": "rice" };
    expect(
      normaliseData({ ingredientGroups: overrides }).ingredientGroups
    ).toEqual(overrides);
  });
});
