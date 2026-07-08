import { describe, expect, it } from "vitest";

import { parseBasketQuantity, basketItemName } from "./basketQuantity";

describe("parseBasketQuantity", () => {
  it("returns a null quantity for a plain line", () => {
    expect(parseBasketQuantity("Beef mince")).toEqual({
      name: "Beef mince",
      quantity: null,
    });
  });

  it("reads a trailing count, with or without spacing and brackets", () => {
    expect(parseBasketQuantity("Beef mince x2")).toEqual({
      name: "Beef mince",
      quantity: 2,
    });
    expect(parseBasketQuantity("Milk ×3")).toEqual({
      name: "Milk",
      quantity: 3,
    });
    expect(parseBasketQuantity("Eggs (x6)")).toEqual({
      name: "Eggs",
      quantity: 6,
    });
  });

  it("reads a leading count", () => {
    expect(parseBasketQuantity("2x Beef mince")).toEqual({
      name: "Beef mince",
      quantity: 2,
    });
  });

  it("does not mistake a weight or a word ending in x for a count", () => {
    expect(parseBasketQuantity("500g beef mince")).toEqual({
      name: "500g beef mince",
      quantity: null,
    });
    // No space before the x — treat it as part of the name, not a count.
    expect(parseBasketQuantity("Pyrex2")).toEqual({
      name: "Pyrex2",
      quantity: null,
    });
  });

  it("clamps counts into a sane range", () => {
    expect(parseBasketQuantity("Rice x0").quantity).toBe(1);
    expect(parseBasketQuantity("Rice x500").quantity).toBe(99);
  });

  it("basketItemName strips the count", () => {
    expect(basketItemName("Beef mince x2")).toBe("Beef mince");
    expect(basketItemName("Milk")).toBe("Milk");
  });
});
