import { describe, it, expect } from "vitest";

import { pantrySubcategory, groupBySubcategory } from "./pantrySubcategory";

describe("pantrySubcategory", () => {
  it("sorts seasoning into spices", () => {
    expect(pantrySubcategory("Curry Powder")).toBe("spices");
    expect(pantrySubcategory("Garlic Powder")).toBe("spices");
    expect(pantrySubcategory("Ground Coriander")).toBe("spices");
    expect(pantrySubcategory("Chilli Flakes")).toBe("spices");
  });

  it("sorts oils and sauces into sauces", () => {
    expect(pantrySubcategory("Olive Oil")).toBe("sauces");
    expect(pantrySubcategory("Soy Sauce")).toBe("sauces");
    expect(pantrySubcategory("Peanut Butter")).toBe("sauces");
    expect(pantrySubcategory("Honey")).toBe("sauces");
  });

  it("sorts canned goods into canned", () => {
    expect(pantrySubcategory("Canned Beans")).toBe("canned");
    expect(pantrySubcategory("Crushed Tomatoes")).toBe("canned");
    expect(pantrySubcategory("Coconut Milk")).toBe("canned");
    expect(pantrySubcategory("Tinned Tuna")).toBe("canned");
  });

  it("sorts dry staples into grains", () => {
    expect(pantrySubcategory("Rice")).toBe("grains");
    expect(pantrySubcategory("Pasta")).toBe("grains");
    expect(pantrySubcategory("Breadcrumbs")).toBe("grains");
  });

  it("matches keywords the tokenizer singularises (e.g. couscous)", () => {
    // "couscous" tokenises to "couscou"; the keyword is singularised to match.
    expect(pantrySubcategory("Couscous")).toBe("grains");
    expect(pantrySubcategory("Quinoa")).toBe("grains");
  });

  it("distinguishes baking powder from spice powders", () => {
    expect(pantrySubcategory("Baking Powder")).toBe("baking");
    expect(pantrySubcategory("Sugar")).toBe("baking");
  });

  it("falls back to other for unknowns", () => {
    expect(pantrySubcategory("Dashi Sachet")).toBe("other");
  });

  it("honours a valid stored override over the name", () => {
    // "Olive Oil" would derive to sauces, but a hand-picked subgroup wins.
    expect(pantrySubcategory("Olive Oil", "baking")).toBe("baking");
  });

  it("ignores an invalid or blank override and derives from the name", () => {
    expect(pantrySubcategory("Olive Oil", "nonsense")).toBe("sauces");
    expect(pantrySubcategory("Olive Oil", "")).toBe("sauces");
  });
});

describe("groupBySubcategory", () => {
  it("leaves non-Pantry categories as a single unlabelled group", () => {
    const items = [{ name: "Milk" }, { name: "Cheese" }];
    const groups = groupBySubcategory("Dairy", items);
    expect(groups).toHaveLength(1);
    expect(groups[0].label).toBeNull();
    expect(groups[0].items).toEqual(items);
  });

  it("splits Pantry into ordered, labelled subgroups", () => {
    const groups = groupBySubcategory("Pantry", [
      { name: "Rice" },
      { name: "Paprika" },
      { name: "Olive Oil" },
    ]);
    const labels = groups.map((group) => group.label);
    // Order follows the subcategory list: spices, then sauces, then grains.
    expect(labels).toEqual([
      "Spices & seasoning",
      "Sauces, oils & condiments",
      "Grains, pasta & rice",
    ]);
  });

  it("routes an item by its stored subcategory override", () => {
    const groups = groupBySubcategory("Pantry", [
      { name: "Olive Oil", subcategory: "grains" },
    ]);
    // Olive Oil would normally sit under sauces; the override moves it.
    expect(groups).toHaveLength(1);
    expect(groups[0].label).toBe("Grains, pasta & rice");
  });
});
