import { describe, it, expect } from "vitest";

import { catalogItemStatus, groupCatalogByAisle } from "./catalogUtils";

describe("catalogItemStatus", () => {
  const inventory = [
    { id: "1", name: "Milk", active: true },
    { id: "2", name: "Butter", active: false },
  ];

  it("reports in / out / off by normalised name", () => {
    expect(catalogItemStatus("Milk", inventory)).toBe("in");
    expect(catalogItemStatus("milk", inventory)).toBe("in"); // case-insensitive
    expect(catalogItemStatus("Butter", inventory)).toBe("out");
    expect(catalogItemStatus("Eggs", inventory)).toBe("off");
  });
});

describe("groupCatalogByAisle", () => {
  it("orders aisles by the canonical category order, dropping empties", () => {
    const groups = groupCatalogByAisle([
      { name: "Rice", category: "Pantry" },
      { name: "Apple", category: "Fruit & Veg" },
      { name: "Milk", category: "Dairy" },
    ]);

    expect(groups.map((g) => g.aisle)).toEqual([
      "Fruit & Veg",
      "Dairy",
      "Pantry",
    ]);
    expect(groups[0].items.map((i) => i.name)).toEqual(["Apple"]);
  });

  it("sends unknown aisles to the end", () => {
    const groups = groupCatalogByAisle([
      { name: "Mystery", category: "Spaceship" },
      { name: "Milk", category: "Dairy" },
    ]);

    expect(groups.map((g) => g.aisle)).toEqual(["Dairy", "Spaceship"]);
  });
});
