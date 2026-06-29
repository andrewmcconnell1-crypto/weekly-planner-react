// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";

import { useCelebrate } from "./useCelebrate";
import * as confetti from "../utils/confetti";

describe("useCelebrate", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("fires once on a false → true transition, then not again until reset", () => {
    const spy = vi.spyOn(confetti, "celebrate").mockImplementation(() => {});
    const { rerender } = renderHook(({ active }) => useCelebrate(active), {
      initialProps: { active: false },
    });

    expect(spy).not.toHaveBeenCalled();

    rerender({ active: true });
    expect(spy).toHaveBeenCalledTimes(1);

    rerender({ active: true });
    expect(spy).toHaveBeenCalledTimes(1);

    rerender({ active: false });
    rerender({ active: true });
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it("does not fire if it is already true on mount", () => {
    const spy = vi.spyOn(confetti, "celebrate").mockImplementation(() => {});
    renderHook(() => useCelebrate(true));
    expect(spy).not.toHaveBeenCalled();
  });
});
