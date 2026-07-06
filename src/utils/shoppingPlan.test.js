import { describe, it, expect } from "vitest";

import { buildShoppingPlan } from "./shoppingPlan";

// A single Sunday meal that needs paprika, plus a filler ingredient that's never
// covered by stock or recurring buys so the plan always has at least one row.
const weekMeals = { Sunday: { type: "meal" } };
const getMealSummary = (day) =>
  day === "Sunday"
    ? {
        hasMeal: true,
        name: "Beef Tacos",
        ingredients: ["2 tsp paprika", "500g beef mince"],
      }
    : { hasMeal: false, name: day, ingredients: [] };

function plan({ staples = [], inventory = [], shoppingItems = [] }) {
  return buildShoppingPlan({
    staples,
    inventory,
    shoppingItems,
    weekMeals,
    weekKey: "2026-06-14",
    getMealSummary,
  });
}

// The list the app actually renders is retained items followed by generated ones.
function renderedList(result) {
  return [...result.retainedShoppingItems, ...result.newItems];
}

function paprikaRows(result) {
  return renderedList(result).filter((item) =>
    item.name.toLowerCase().includes("paprika")
  );
}

const paprikaOutOfStock = [
  { id: "i1", name: "Paprika", active: false, category: "Pantry" },
];
const paprikaInStock = [
  { id: "i1", name: "Paprika", active: true, category: "Pantry" },
];

describe("buildShoppingPlan — already-have suppression", () => {
  it("keeps a meal ingredient that nothing covers", () => {
    const result = plan({ inventory: paprikaInStock });
    const names = renderedList(result).map((i) => i.name.toLowerCase());
    expect(names.some((n) => n.includes("beef"))).toBe(true);
  });

  it("suppresses a meal ingredient that's in active stock", () => {
    const result = plan({ inventory: paprikaInStock });
    expect(paprikaRows(result)).toHaveLength(0);
  });

  it("suppresses a meal ingredient that's an active recurring buy", () => {
    const result = plan({
      staples: [
        {
          id: "s1",
          name: "Paprika",
          active: true,
          frequency: "weekly",
          startDate: "2026-06-01",
          category: "Pantry",
        },
      ],
    });
    expect(paprikaRows(result)).toHaveLength(0);
  });
});

describe("buildShoppingPlan — out-of-stock + meal ingredient", () => {
  it("lists an out-of-stock meal ingredient exactly once (restock, not meal)", () => {
    const result = plan({ inventory: paprikaOutOfStock });
    const rows = paprikaRows(result);
    expect(rows).toHaveLength(1);
    expect(rows[0].source).toBe("Restock");
  });

  it("does not double-list when a stale generated meal row already exists", () => {
    const result = plan({
      inventory: paprikaOutOfStock,
      shoppingItems: [
        {
          id: "g1",
          name: "2 tsp paprika",
          source: "Meal",
          category: "Meal ingredients",
          checked: false,
        },
      ],
    });
    expect(paprikaRows(result)).toHaveLength(1);
  });

  it("does not double-list a manual override against a restock row", () => {
    // The regression: "2 tsp paprika" (manual) normalises differently from the
    // "Paprika" restock, so exact-name dedup missed it and both appeared.
    const result = plan({
      inventory: paprikaOutOfStock,
      shoppingItems: [
        {
          id: "m1",
          name: "2 tsp paprika",
          source: "Manual",
          category: "Meal ingredients",
          checked: false,
        },
      ],
    });
    const rows = paprikaRows(result);
    expect(rows).toHaveLength(1);
    expect(rows[0].source).toBe("Restock");
  });
});

describe("buildShoppingPlan — manual overrides are preserved", () => {
  it("keeps an 'add it anyway' override when nothing else covers it", () => {
    // Paprika in stock => meal ingredient suppressed and no restock generated,
    // so a manual re-add must survive (this is the override's whole point).
    const result = plan({
      inventory: paprikaInStock,
      shoppingItems: [
        {
          id: "m1",
          name: "2 tsp paprika",
          source: "Manual",
          category: "Meal ingredients",
          checked: false,
        },
      ],
    });
    const rows = paprikaRows(result);
    expect(rows).toHaveLength(1);
    expect(rows[0].source).toBe("Manual");
  });

  it("leaves unrelated manual items untouched", () => {
    const result = plan({
      inventory: paprikaOutOfStock,
      shoppingItems: [
        {
          id: "m1",
          name: "Birthday candles",
          source: "Manual",
          category: "Other",
          checked: false,
        },
      ],
    });
    const names = renderedList(result).map((i) => i.name);
    expect(names).toContain("Birthday candles");
  });
});

describe("buildShoppingPlan — meal ingredient hygiene", () => {
  const twoMealWeek = { Sunday: { type: "meal" }, Monday: { type: "meal" } };
  const summaries = {
    Sunday: {
      hasMeal: true,
      name: "Dragon Noodles",
      ingredients: ["1/2 cup water", "2 tbsp cornstarch"],
    },
    Monday: {
      hasMeal: true,
      name: "Dahl",
      ingredients: ["1 cup warm water", "1 onion"],
    },
  };
  const planTwoMeals = ({ inventory = [] }) =>
    buildShoppingPlan({
      staples: [],
      inventory,
      shoppingItems: [],
      weekMeals: twoMealWeek,
      weekKey: "2026-06-14",
      getMealSummary: (day) =>
        summaries[day] || { hasMeal: false, name: day, ingredients: [] },
    });

  it("never puts water on the list, from any meal", () => {
    const names = renderedList(planTwoMeals({})).map((i) => i.name.toLowerCase());
    expect(names.some((n) => n.includes("water"))).toBe(false);
  });

  it("suppresses US-named ingredients covered by the local stock name", () => {
    const result = planTwoMeals({
      inventory: [{ id: "i1", name: "Cornflour", active: true, category: "Pantry" }],
    });
    const names = renderedList(result).map((i) => i.name.toLowerCase());
    expect(names.some((n) => n.includes("cornstarch"))).toBe(false);
    expect(result.skippedItems.some((i) => i.coveredBy === "Cornflour")).toBe(true);
  });

  it("lists the same food wanted by two meals only once", () => {
    const dayMeals = { Sunday: { type: "meal" }, Monday: { type: "meal" } };
    const soySummaries = {
      Sunday: { hasMeal: true, name: "Stir fry", ingredients: ["2 tbsp soy sauce"] },
      Monday: { hasMeal: true, name: "Bowls", ingredients: ["1/4 cup soy sauce"] },
    };
    const result = buildShoppingPlan({
      staples: [],
      inventory: [],
      shoppingItems: [],
      weekMeals: dayMeals,
      weekKey: "2026-06-14",
      getMealSummary: (day) =>
        soySummaries[day] || { hasMeal: false, name: day, ingredients: [] },
    });
    const soyRows = renderedList(result).filter((i) =>
      i.name.toLowerCase().includes("soy")
    );
    expect(soyRows).toHaveLength(1);
  });
});
