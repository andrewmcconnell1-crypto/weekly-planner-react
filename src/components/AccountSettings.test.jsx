// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";

import AccountSettings from "./AccountSettings";

function setup(props = {}) {
  const handlers = {
    user: { user_metadata: { full_name: "Sam Jones" }, email: "sam@x.com" },
    onUpdateName: vi.fn().mockResolvedValue({ error: null }),
    onUpdatePassword: vi.fn().mockResolvedValue({ error: null }),
  };
  render(<AccountSettings {...handlers} {...props} />);
  return handlers;
}

describe("AccountSettings", () => {
  it("prefills the current name and only enables save when it changes", async () => {
    const user = userEvent.setup();
    const { onUpdateName } = setup();

    const input = screen.getByPlaceholderText("Your name");
    expect(input).toHaveValue("Sam Jones");

    const saveName = screen.getByRole("button", { name: /Save name/i });
    expect(saveName).toBeDisabled();

    await user.clear(input);
    await user.type(input, "Sam J");
    expect(saveName).toBeEnabled();
    await user.click(saveName);
    expect(onUpdateName).toHaveBeenCalledWith("Sam J");
  });

  it("rejects a short or mismatched password", async () => {
    const user = userEvent.setup();
    const { onUpdatePassword } = setup();

    await user.type(screen.getByPlaceholderText(/At least 6/i), "abc");
    await user.type(screen.getByPlaceholderText(/Re-enter it/i), "abc");
    await user.click(screen.getByRole("button", { name: /Update password/i }));
    expect(screen.getByText(/at least 6/i)).toBeInTheDocument();
    expect(onUpdatePassword).not.toHaveBeenCalled();

    await user.clear(screen.getByPlaceholderText(/At least 6/i));
    await user.type(screen.getByPlaceholderText(/At least 6/i), "secret1");
    await user.type(screen.getByPlaceholderText(/Re-enter it/i), "secret2");
    await user.click(screen.getByRole("button", { name: /Update password/i }));
    expect(screen.getByText(/don't match/i)).toBeInTheDocument();
    expect(onUpdatePassword).not.toHaveBeenCalled();
  });

  it("submits a valid matching password", async () => {
    const user = userEvent.setup();
    const { onUpdatePassword } = setup();

    await user.type(screen.getByPlaceholderText(/At least 6/i), "secret1");
    await user.type(screen.getByPlaceholderText(/Re-enter it/i), "secret1");
    await user.click(screen.getByRole("button", { name: /Update password/i }));
    expect(onUpdatePassword).toHaveBeenCalledWith("secret1");
  });
});
