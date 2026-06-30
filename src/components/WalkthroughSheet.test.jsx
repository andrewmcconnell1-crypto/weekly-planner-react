// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";

import WalkthroughSheet from "./WalkthroughSheet";
import { WALKTHROUGH_STEPS } from "./walkthroughSteps";

function setup(props = {}) {
  const handlers = { onClose: vi.fn(), onStartPlanning: vi.fn() };
  render(<WalkthroughSheet {...handlers} {...props} />);
  return handlers;
}

describe("WalkthroughSheet", () => {
  it("opens on the first step", () => {
    setup();
    expect(
      screen.getByRole("heading", { name: WALKTHROUGH_STEPS[0].title })
    ).toBeInTheDocument();
    expect(screen.getByText("Step 1")).toBeInTheDocument();
  });

  it("advances through the steps with Next", async () => {
    const user = userEvent.setup();
    setup();

    await user.click(screen.getByRole("button", { name: /Next/i }));
    expect(
      screen.getByRole("heading", { name: WALKTHROUGH_STEPS[1].title })
    ).toBeInTheDocument();
  });

  it("jumps to a step via its dot", async () => {
    const user = userEvent.setup();
    setup();

    const last = WALKTHROUGH_STEPS.length;
    await user.click(
      screen.getByRole("tab", {
        name: new RegExp(`Step ${last}:`),
      })
    );
    expect(
      screen.getByRole("button", { name: /Start planning/i })
    ).toBeInTheDocument();
  });

  it("calls onStartPlanning from the last step", async () => {
    const user = userEvent.setup();
    const { onStartPlanning } = setup();

    // Walk to the last step.
    for (let i = 0; i < WALKTHROUGH_STEPS.length - 1; i += 1) {
      await user.click(screen.getByRole("button", { name: /Next/i }));
    }

    await user.click(screen.getByRole("button", { name: /Start planning/i }));
    expect(onStartPlanning).toHaveBeenCalledTimes(1);
  });

  it("Skip on the first step requests close", async () => {
    const user = userEvent.setup();
    const { onClose } = setup();

    await user.click(screen.getByRole("button", { name: /Skip/i }));
    // Close is debounced behind the 220ms exit animation.
    await new Promise((resolve) => setTimeout(resolve, 260));
    expect(onClose).toHaveBeenCalled();
  });
});
