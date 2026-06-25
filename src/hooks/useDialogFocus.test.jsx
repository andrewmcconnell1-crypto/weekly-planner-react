// @vitest-environment jsdom
import { useRef } from "react";
import { describe, it, expect, afterEach } from "vitest";
import { render, fireEvent, cleanup, screen } from "@testing-library/react";

import { useDialogFocus } from "./useDialogFocus";

afterEach(cleanup);

function Dialog() {
  const ref = useRef(null);
  useDialogFocus(ref);
  return (
    <div ref={ref} tabIndex={-1} role="dialog">
      <button>first</button>
      <button>last</button>
    </div>
  );
}

describe("useDialogFocus", () => {
  it("moves focus to the first control on open and restores it on close", () => {
    const trigger = document.createElement("button");
    document.body.appendChild(trigger);
    trigger.focus();
    expect(document.activeElement).toBe(trigger);

    const { unmount } = render(<Dialog />);
    expect(document.activeElement?.textContent).toBe("first");

    unmount();
    expect(document.activeElement).toBe(trigger);
    trigger.remove();
  });

  it("wraps Tab from the last control back to the first", () => {
    render(<Dialog />);
    const first = screen.getByText("first");
    const last = screen.getByText("last");

    last.focus();
    fireEvent.keyDown(last, { key: "Tab" });
    expect(document.activeElement).toBe(first);
  });

  it("wraps Shift+Tab from the first control to the last", () => {
    render(<Dialog />);
    const first = screen.getByText("first");
    const last = screen.getByText("last");

    first.focus();
    fireEvent.keyDown(first, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(last);
  });
});
