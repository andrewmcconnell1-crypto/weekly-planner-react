import { describe, expect, it } from "vitest";

import { rankRecipesByCoverage } from "./recipeCoverage";

const recipes = [
  {
    id: "r1",
    name: "Fried Rice",
    ingredients: ["2 cups rice", "3 eggs", "2 tbsp soy sauce", "1 cup water", "salt and pepper"],
  },
  {
    id: "r2",
    name: "Beef Tacos",
    ingredients: ["500 g beef mince", "10 taco shells", "1 brown onion"],
  },
  {
    id: "r3",
    name: "Big Shop Stew",
    ingredients: ["1 kg beef chuck", "4 carrots", "2 celery sticks", "3 cups beef stock"],
  },
];

describe("rankRecipesByCoverage", () => {
  it("marks a fully-covered recipe ready, ignoring water and salt & pepper", () => {
    const [top] = rankRecipesByCoverage({
      recipes,
      basketItems: ["Eggs", "Soy sauce"],
      inventory: [{ name: "Rice", active: true }],
    });
    expect(top.recipe.id).toBe("r1");
    expect(top.tier).toBe("ready");
    expect(top.missing).toEqual([]);
  });

  it("tiers by missing count and lists what's missing", () => {
    const ranked = rankRecipesByCoverage({
      recipes,
      basketItems: ["Beef mince", "Taco shells"],
    });
    const tacos = ranked.find((entry) => entry.recipe.id === "r2");
    expect(tacos.tier).toBe("almost");
    expect(tacos.missing).toEqual(["1 brown onion"]);

    const stew = ranked.find((entry) => entry.recipe.id === "r3");
    expect(stew.tier).toBe("more");
  });

  it("counts inactive stock and paused recurring buys as not-having", () => {
    const [top] = rankRecipesByCoverage({
      recipes: [recipes[1]],
      staples: [{ name: "Taco shells", active: false }],
      inventory: [{ name: "Beef mince", active: false }],
    });
    expect(top.missing).toHaveLength(3);
  });

  it("claims basket units so a planned recipe depletes them for others", () => {
    const minceRecipes = [
      { id: "a", name: "Mince A", ingredients: ["500 g beef mince"] },
      { id: "b", name: "Mince B", ingredients: ["500 g beef mince"] },
    ];

    // One packet of mince — without claiming both would read as ready.
    const both = rankRecipesByCoverage({
      recipes: minceRecipes,
      basketItems: ["Beef mince"],
    });
    expect(both.every((entry) => entry.tier === "ready")).toBe(true);

    // Once A is planned it claims the only mince, so B is no longer covered.
    const afterA = rankRecipesByCoverage({
      recipes: minceRecipes,
      basketItems: ["Beef mince"],
      plannedRecipes: [minceRecipes[0]],
    });
    const b = afterA.find((entry) => entry.recipe.id === "b");
    expect(b.tier).not.toBe("ready");
    expect(b.missing).toEqual(["500 g beef mince"]);
  });

  it("does not deplete stock or recurring buys when recipes are planned", () => {
    const eggRecipes = [
      { id: "a", name: "Omelette", ingredients: ["3 eggs"] },
      { id: "b", name: "Frittata", ingredients: ["6 eggs"] },
    ];

    const ranked = rankRecipesByCoverage({
      recipes: eggRecipes,
      inventory: [{ name: "Eggs", active: true }],
      plannedRecipes: [eggRecipes[0]],
    });
    // Stock is always-on-hand, so planning one egg dish leaves the other ready.
    expect(ranked.every((entry) => entry.tier === "ready")).toBe(true);
  });

  it("gives two basket units to cover two planned mince recipes", () => {
    const recipe = { id: "a", name: "Mince A", ingredients: ["beef mince"] };
    const other = { id: "b", name: "Mince B", ingredients: ["beef mince"] };

    const ranked = rankRecipesByCoverage({
      recipes: [recipe, other],
      basketItems: ["Beef mince", "Beef mince"],
      plannedRecipes: [recipe],
    });
    // Two packets: one claimed by A, one still available for B.
    expect(ranked.find((entry) => entry.recipe.id === "b").tier).toBe("ready");
  });
});
