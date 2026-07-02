// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";

import InstallBanner from "./InstallBanner";

describe("InstallBanner", () => {
  it("shows an Install button in prompt mode and fires the native prompt", async () => {
    const onInstall = vi.fn();
    const user = userEvent.setup();
    render(
      <InstallBanner mode="prompt" onInstall={onInstall} onDismiss={() => {}} />
    );

    const button = screen.getByRole("button", { name: "Install" });
    await user.click(button);
    expect(onInstall).toHaveBeenCalledTimes(1);
  });

  it("shows Add to Home Screen guidance (and no Install button) in ios mode", () => {
    render(
      <InstallBanner mode="ios" onInstall={() => {}} onDismiss={() => {}} />
    );

    expect(screen.getByText(/Add to Home Screen/i)).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Install" })
    ).not.toBeInTheDocument();
  });

  it("can be dismissed", async () => {
    const onDismiss = vi.fn();
    const user = userEvent.setup();
    render(
      <InstallBanner mode="prompt" onInstall={() => {}} onDismiss={onDismiss} />
    );

    await user.click(screen.getByRole("button", { name: /dismiss/i }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
