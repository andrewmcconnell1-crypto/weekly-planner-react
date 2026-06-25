// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";

import SwipeRow from "./SwipeRow";

afterEach(cleanup);

describe("SwipeRow", () => {
  it("keeps the delete action keyboard-reachable with an accessible name", () => {
    render(
      <SwipeRow onDelete={() => {}} itemName="Milk">
        <span>Milk</span>
      </SwipeRow>
    );

    const button = screen.getByRole("button", { name: "Delete Milk" });
    // No tabindex=-1 and not aria-hidden, so keyboard / SR users can reach it
    // without swiping.
    expect(button.getAttribute("tabindex")).not.toBe("-1");
    expect(button.getAttribute("aria-hidden")).toBe(null);
  });

  it("reveals the row on focus and closes it again on blur", () => {
    const { container } = render(
      <SwipeRow onDelete={() => {}} itemName="Milk">
        <span>Milk</span>
      </SwipeRow>
    );

    const button = screen.getByRole("button", { name: "Delete Milk" });
    const content = container.querySelector(".swipe-row-content");

    fireEvent.focus(button);
    expect(content.style.transform).toBe("translateX(-88px)");

    fireEvent.blur(button);
    expect(content.style.transform).toBe("translateX(0px)");
  });

  it("deletes when the action is activated", () => {
    const onDelete = vi.fn();
    render(
      <SwipeRow onDelete={onDelete} itemName="Milk">
        <span>Milk</span>
      </SwipeRow>
    );

    fireEvent.click(screen.getByRole("button", { name: "Delete Milk" }));
    expect(onDelete).toHaveBeenCalledTimes(1);
  });
});
