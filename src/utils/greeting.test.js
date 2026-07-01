import { describe, it, expect } from "vitest";

import { greeting } from "./greeting";

function at(hour) {
  return greeting(new Date(2026, 0, 1, hour, 0, 0));
}

describe("greeting", () => {
  it("varies by time of day", () => {
    expect(at(8)).toBe("Good morning");
    expect(at(14)).toBe("Good afternoon");
    expect(at(19)).toBe("Good evening");
    expect(at(2)).toBe("Good night");
    expect(at(23)).toBe("Good night");
  });

  it("adds the first name when given", () => {
    const morning = new Date(2026, 0, 1, 8, 0, 0);
    expect(greeting(morning, "Andrew McConnell")).toBe("Good morning, Andrew");
    expect(greeting(morning, "  ")).toBe("Good morning");
    expect(greeting(morning)).toBe("Good morning");
  });
});
