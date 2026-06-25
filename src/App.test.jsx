// @vitest-environment jsdom
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";

import App from "./App";

afterEach(cleanup);

// Throwaway smoke test: mount the real App (local-only mode, no Supabase) and
// click through every tab so the refactored screen components / action hooks all
// render without throwing.
describe("App smoke", () => {
  it("renders Home and navigates every tab", () => {
    render(<App />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Home" })
    ).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /Meals/ }));
    expect(screen.getByRole("heading", { level: 1, name: "Meals" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /Shop/ }));
    expect(
      screen.getByRole("heading", { level: 1, name: "Shopping list" })
    ).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /Kitchen/ }));
    expect(
      screen.getByRole("heading", { level: 1, name: "Kitchen" })
    ).toBeTruthy();
  });
});
