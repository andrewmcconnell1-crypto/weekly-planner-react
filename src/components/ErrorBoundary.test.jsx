// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";

import ErrorBoundary from "./ErrorBoundary";

afterEach(cleanup);

function Boom() {
  throw new Error("kaboom");
}

describe("ErrorBoundary", () => {
  it("renders its children when nothing throws", () => {
    render(
      <ErrorBoundary>
        <p>all good</p>
      </ErrorBoundary>
    );

    expect(screen.getByText("all good")).toBeTruthy();
  });

  it("shows a recoverable fallback when a child throws", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>
    );

    expect(screen.getByRole("alert")).toBeTruthy();
    expect(screen.getByText("Something went wrong")).toBeTruthy();
    expect(screen.getByRole("button", { name: /Reload app/ })).toBeTruthy();

    spy.mockRestore();
  });

  it("re-renders the children when 'Try again' is clicked and they recover", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    let shouldThrow = true;
    function Maybe() {
      if (shouldThrow) throw new Error("kaboom");
      return <p>recovered</p>;
    }

    render(
      <ErrorBoundary>
        <Maybe />
      </ErrorBoundary>
    );

    expect(screen.getByRole("alert")).toBeTruthy();

    shouldThrow = false;
    fireEvent.click(screen.getByRole("button", { name: /Try again/ }));

    expect(screen.getByText("recovered")).toBeTruthy();

    spy.mockRestore();
  });
});
