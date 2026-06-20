import { describe, it, expect } from "vitest";

import {
  normaliseInventoryItems,
  mergeSavedRecipes,
} from "./dataLoaders";
import { initialRecipes } from "../data/initialRecipes";

describe("normaliseInventoryItems", () => {
  it("migrates retired categories to Pantry", () => {
    const [item] = normaliseInventoryItems([
      { id: "x1", name: "Olive Oil", category: "Condiments" },
    ]);
    expect(item.category).toBe("Pantry");
  });

  it("keeps user items and defaults a missing category to Other", () => {
    const [item] = normaliseInventoryItems([{ id: "x2", name: "Mystery Jar" }]);
    expect(item.category).toBe("Other");
    expect(item.active).toBe(true);
  });

  it("drops starter items that are no longer in the bundled list", () => {
    const result = normaliseInventoryItems([
      { id: "starter-inventory-ghost", name: "Ghost Item" },
      { id: "x3", name: "Hand-added", category: "Dairy" },
    ]);
    expect(result.map((i) => i.name)).toEqual(["Hand-added"]);
  });
});

describe("mergeSavedRecipes", () => {
  it("appends any bundled recipes missing from the saved set", () => {
    const merged = mergeSavedRecipes([]);
    expect(merged).toHaveLength(initialRecipes.length);
  });

  it("applies recipe id aliases", () => {
    const merged = mergeSavedRecipes([
      { id: "spaghetti-bolognese", name: "Spag Bol", ingredients: [] },
    ]);
    expect(merged.some((r) => r.id === "bolognese")).toBe(true);
  });

  it("defaults serves, tags and timeMins for a user-created recipe", () => {
    const merged = mergeSavedRecipes([
      { id: "mine-1", name: "My Dinner", ingredients: [] },
    ]);
    const recipe = merged.find((r) => r.id === "mine-1");
    expect(recipe.serves).toBe(4);
    expect(recipe.tags).toEqual([]);
    expect(recipe.timeMins).toBeNull();
  });

  it("seeds the bundled recipes with metadata tags", () => {
    const merged = mergeSavedRecipes([]);
    expect(merged.every((r) => Array.isArray(r.tags))).toBe(true);
    expect(merged.some((r) => r.tags.length > 0)).toBe(true);
  });

  it("keeps edits to built-ins, but refreshes them on request", () => {
    const bundled = initialRecipes[0];
    const edited = [{ ...bundled, name: "EDITED NAME" }];

    const kept = mergeSavedRecipes(edited, false);
    expect(kept.find((r) => r.id === bundled.id).name).toBe("EDITED NAME");

    const refreshed = mergeSavedRecipes(edited, true);
    expect(refreshed.find((r) => r.id === bundled.id).name).toBe(bundled.name);
  });
});
