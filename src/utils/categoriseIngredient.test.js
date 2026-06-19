import { describe, it, expect } from "vitest";

import { categoriseIngredient } from "./categoriseIngredient";

describe("categoriseIngredient", () => {
  it("files meats and seafood under Meat", () => {
    expect(categoriseIngredient("500g chicken thigh fillets")).toBe("Meat");
    expect(categoriseIngredient("400g beef mince")).toBe("Meat");
    expect(categoriseIngredient("2 salmon fillets")).toBe("Meat");
  });

  it("files fresh produce under Fruit & Veg", () => {
    expect(categoriseIngredient("1 brown onion, finely chopped")).toBe(
      "Fruit & Veg"
    );
    expect(categoriseIngredient("2 cloves garlic")).toBe("Fruit & Veg");
    expect(categoriseIngredient("a handful of fresh coriander")).toBe(
      "Fruit & Veg"
    );
  });

  it("files dairy and eggs under Dairy", () => {
    expect(categoriseIngredient("300ml thickened cream")).toBe("Dairy");
    expect(categoriseIngredient("2 eggs")).toBe("Dairy");
    expect(categoriseIngredient("1 cup grated cheddar cheese")).toBe("Dairy");
  });

  it("files dry goods, spices, oils and sauces under Pantry", () => {
    expect(categoriseIngredient("2 cups basmati rice")).toBe("Pantry");
    expect(categoriseIngredient("400g can coconut milk")).toBe("Pantry");
    expect(categoriseIngredient("500g dried pasta")).toBe("Pantry");
    expect(categoriseIngredient("1 tsp ground cumin")).toBe("Pantry");
    expect(categoriseIngredient("2 tbsp olive oil")).toBe("Pantry");
    expect(categoriseIngredient("3 tbsp soy sauce")).toBe("Pantry");
  });

  it("files bread products under Bakery", () => {
    expect(categoriseIngredient("4 flour tortillas")).toBe("Bakery");
    expect(categoriseIngredient("1 loaf crusty bread")).toBe("Bakery");
  });

  it("falls back to Other when nothing matches", () => {
    expect(categoriseIngredient("1 sachet dashi")).toBe("Other");
    expect(categoriseIngredient("")).toBe("Other");
  });
});
