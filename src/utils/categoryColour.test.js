import { describe, it, expect } from "vitest";

import { aisleTone } from "./categoryColour";

describe("aisleTone", () => {
  it("maps known aisles to their tone", () => {
    expect(aisleTone("Fruit & Veg")).toBe("produce");
    expect(aisleTone("Dairy")).toBe("dairy");
    expect(aisleTone("Meat")).toBe("meat");
    expect(aisleTone("Frozen")).toBe("frozen");
  });

  it("falls back to 'other' for blank input", () => {
    expect(aisleTone("")).toBe("other");
    expect(aisleTone(undefined)).toBe("other");
  });

  it("gives user-created categories a stable colour from the palette", () => {
    const tone = aisleTone("Garden");
    expect(aisleTone("Garden")).toBe(tone); // deterministic
    expect([
      "produce", "dairy", "bakery", "meat", "pantry",
      "snacks", "frozen", "household", "toiletries",
    ]).toContain(tone);
  });
});
