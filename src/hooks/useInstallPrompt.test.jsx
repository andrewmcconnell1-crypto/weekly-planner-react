// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

import { useInstallPrompt } from "./useInstallPrompt";

function Harness() {
  const { canPromptInstall, isStandalone } = useInstallPrompt();
  return (
    <div>
      <span data-testid="can">{String(canPromptInstall)}</span>
      <span data-testid="standalone">{String(isStandalone)}</span>
    </div>
  );
}

function mockStandalone(matches) {
  window.matchMedia = vi.fn().mockImplementation((query) => ({
    matches,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
}

beforeEach(() => {
  mockStandalone(false);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("useInstallPrompt", () => {
  it("captures beforeinstallprompt so the app can offer to install", () => {
    render(<Harness />);
    expect(screen.getByTestId("can")).toHaveTextContent("false");

    const event = new Event("beforeinstallprompt");
    event.prompt = vi.fn();
    event.userChoice = Promise.resolve({ outcome: "accepted" });

    act(() => {
      window.dispatchEvent(event);
    });

    expect(screen.getByTestId("can")).toHaveTextContent("true");
  });

  it("flips to installed once the appinstalled event fires", () => {
    render(<Harness />);
    expect(screen.getByTestId("standalone")).toHaveTextContent("false");

    act(() => {
      window.dispatchEvent(new Event("appinstalled"));
    });

    expect(screen.getByTestId("standalone")).toHaveTextContent("true");
  });

  it("reports standalone when launched from the home screen", () => {
    mockStandalone(true);
    render(<Harness />);
    expect(screen.getByTestId("standalone")).toHaveTextContent("true");
  });
});
