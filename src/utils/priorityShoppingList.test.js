import { describe, it, expect } from "vitest";

import {
  buildUnifiedShoppingList,
  groupByAisle,
  groupByTier,
  categoryRank,
} from "./priorityShoppingList";
import { categories } from "../data/categories";
import { canonicalKey } from "./ingredientMatch";

describe("categoryRank", () => {
  it("ranks known aisles by their canonical order", () => {
    expect(categoryRank("Meat")).toBe(categories.indexOf("Meat"));
    expect(categoryRank("Pantry")).toBe(categories.indexOf("Pantry"));
  });

  it("sends unknown categories to the end", () => {
    expect(categoryRank("Mystery")).toBe(categories.length);
  });
});

describe("groupByAisle", () => {
  it("orders aisles canonically and names within an aisle alphabetically", () => {
    const groups = groupByAisle([
      { name: "Zucchini", category: "Fruit & Veg" },
      { name: "Apple", category: "Fruit & Veg" },
      { name: "Chicken", category: "Meat" },
    ]);

    expect(groups.map((g) => g.category)).toEqual(["Fruit & Veg", "Meat"]);
    expect(groups[0].items.map((i) => i.name)).toEqual(["Apple", "Zucchini"]);
  });

  it("folds a retired category into its current aisle", () => {
    const groups = groupByAisle([{ name: "Soy Sauce", category: "Condiments" }]);
    expect(groups[0].category).toBe("Pantry");
  });
});

describe("groupByTier", () => {
  it("keeps only non-empty tiers, in priority order", () => {
    const tiers = groupByTier([
      { name: "Milk", category: "Dairy", tier: "soon" },
      { name: "Rice", category: "Pantry", tier: "week" },
    ]);

    expect(tiers.map((t) => t.key)).toEqual(["soon", "week"]);
    expect(tiers[0].count).toBe(1);
  });
});

describe("buildUnifiedShoppingList", () => {
  const getMealSummary = (day) =>
    day === "Monday"
      ? { hasMeal: true, name: "Beef Tacos", ingredients: ["beef mince"] }
      : { hasMeal: false, name: day, ingredients: [] };

  const base = {
    staples: [],
    inventory: [],
    mealsByWeek: { W1: { Monday: { mealType: "cook" } }, W2: {} },
    currentWeekKey: "W1",
    nextWeekKey: "W2",
    todayDayName: "Sunday",
    getMealSummary,
    keepStandingList: true,
    usingSavedList: false,
  };

  it("collects meal ingredients and manual items, tiering by day distance", () => {
    const { items } = buildUnifiedShoppingList({
      ...base,
      manualItems: [{ name: "Milk", category: "Dairy", tier: "soon" }],
    });

    const beef = items.find((i) => i.name === "beef mince");
    expect(beef.source).toBe("Meal");
    expect(beef.category).toBe("Meat"); // auto-categorised
    expect(beef.tier).toBe("soon"); // Monday is one day from Sunday

    const milk = items.find((i) => i.name === "Milk");
    expect(milk.source).toBe("Manual");
    expect(milk.tier).toBe("soon");
  });

  it("lets a manual item override an auto-generated duplicate", () => {
    const { items } = buildUnifiedShoppingList({
      ...base,
      manualItems: [{ name: "beef mince", category: "Meat", tier: "next" }],
    });

    const rows = items.filter((i) => i.name.toLowerCase() === "beef mince");
    expect(rows).toHaveLength(1);
    expect(rows[0].source).toBe("Manual");
    expect(rows[0].tier).toBe("next");
  });

  it("marks non-manual items checked from the checked map", () => {
    const { items } = buildUnifiedShoppingList({
      ...base,
      checkedMap: { "beef mince": true },
    });

    expect(items.find((i) => i.name === "beef mince").checked).toBe(true);
  });

  it("never marks a manual item checked (it's removed on tick, not parked in Done)", () => {
    const { items } = buildUnifiedShoppingList({
      ...base,
      manualItems: [{ name: "Milk", category: "Dairy", tier: "soon" }],
      checkedMap: { milk: true },
    });

    expect(items.find((i) => i.name === "Milk").checked).toBe(false);
  });

  it("carries a manual item's id so the row can delete the right one", () => {
    const { items } = buildUnifiedShoppingList({
      ...base,
      manualItems: [
        { id: "manual-milk", name: "Milk", category: "Dairy", tier: "soon" },
      ],
    });

    expect(items.find((i) => i.name === "Milk").manualId).toBe("manual-milk");
  });

  it("surfaces an out-of-stock item as a Restock row carrying its stock id", () => {
    const { items } = buildUnifiedShoppingList({
      ...base,
      inventory: [
        { id: "inv-flour", name: "Flour", category: "Pantry", active: false },
      ],
    });

    const restock = items.find((i) => i.source === "Restock");
    expect(restock.name).toBe("Flour");
    // The link back to the inventory item, so ticking it can mark it in stock.
    expect(restock.sourceId).toBe("inv-flour");
  });

  it("does not surface an in-stock item as a restock", () => {
    const { items } = buildUnifiedShoppingList({
      ...base,
      inventory: [
        { id: "inv-flour", name: "Flour", category: "Pantry", active: true },
      ],
    });

    expect(items.some((i) => i.source === "Restock")).toBe(false);
  });

  it("applies user ingredient-group overrides to coverage", () => {
    const args = {
      ...base,
      getMealSummary: (day) =>
        day === "Monday"
          ? { hasMeal: true, name: "Pancakes", ingredients: ["1 cup flour"] }
          : { hasMeal: false, name: day, ingredients: [] },
      inventory: [
        { id: "inv-spelt", name: "Spelt flour", category: "Pantry", active: true },
      ],
    };

    // Without an override, spelt flour doesn't cover the recipe's "flour".
    const before = buildUnifiedShoppingList(args);
    expect(before.items.some((i) => i.name === "1 cup flour")).toBe(true);

    // Grouping spelt flour under "flour" covers it, dropping it from the list.
    const after = buildUnifiedShoppingList({
      ...args,
      ingredientGroups: { [canonicalKey("Spelt flour")]: "flour" },
    });
    expect(after.items.some((i) => i.name === "1 cup flour")).toBe(false);
  });
});
