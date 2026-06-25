import { describe, it, expect } from "vitest";

import {
  makeSnapshot,
  addSnapshot,
  shouldAutoSnapshot,
  MAX_SNAPSHOTS,
} from "./recoverySnapshots";

describe("addSnapshot", () => {
  it("prepends newest-first and caps the list", () => {
    let list = [];
    for (let i = 0; i < MAX_SNAPSHOTS + 2; i += 1) {
      list = addSnapshot(list, makeSnapshot(`s${i}`, { n: i }, i));
    }

    expect(list).toHaveLength(MAX_SNAPSHOTS);
    expect(list[0].label).toBe(`s${MAX_SNAPSHOTS + 1}`); // newest first
    expect(list.at(-1).label).toBe("s2"); // oldest kept
  });
});

describe("shouldAutoSnapshot", () => {
  it("is true when there are no snapshots", () => {
    expect(shouldAutoSnapshot([])).toBe(true);
  });

  it("is false within the gap and true once past it", () => {
    const now = 1_000_000_000_000;
    const gap = 1000;
    const list = [makeSnapshot("recent", {}, now - 500)];

    expect(shouldAutoSnapshot(list, now, gap)).toBe(false);
    expect(shouldAutoSnapshot(list, now + 600, gap)).toBe(true);
  });
});
