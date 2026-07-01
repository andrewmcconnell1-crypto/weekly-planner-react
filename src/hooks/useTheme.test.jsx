// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";

import { useTheme } from "./useTheme";

function Harness() {
  const { theme, setTheme } = useTheme();
  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <button onClick={() => setTheme("dark")}>dark</button>
      <button onClick={() => setTheme("light")}>light</button>
      <button onClick={() => setTheme("system")}>system</button>
    </div>
  );
}

function mockMatchMedia(matches) {
  window.matchMedia = vi.fn().mockImplementation((query) => ({
    matches,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
}

beforeEach(() => {
  localStorage.clear();
  document.documentElement.removeAttribute("data-theme");
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("useTheme", () => {
  it("applies the chosen theme to <html> and persists it", async () => {
    mockMatchMedia(false);
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByText("dark"));
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    expect(localStorage.getItem("theme")).toBe("dark");

    await user.click(screen.getByText("light"));
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
  });

  it("resolves 'system' against the OS preference", () => {
    mockMatchMedia(true); // OS prefers dark
    localStorage.setItem("theme", "system");
    render(<Harness />);
    expect(screen.getByTestId("theme")).toHaveTextContent("system");
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
  });
});
