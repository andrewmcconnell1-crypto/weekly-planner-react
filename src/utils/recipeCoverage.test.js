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
});
