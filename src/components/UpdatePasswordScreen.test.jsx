// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";

import UpdatePasswordScreen from "./UpdatePasswordScreen";

describe("UpdatePasswordScreen", () => {
  it("rejects mismatched passwords without calling the updater", async () => {
    const user = userEvent.setup();
    const onUpdatePassword = vi.fn().mockResolvedValue({ error: null });
    render(<UpdatePasswordScreen onUpdatePassword={onUpdatePassword} />);

    await user.type(screen.getByPlaceholderText(/At least 6/i), "secret1");
    await user.type(screen.getByPlaceholderText(/Re-enter it/i), "secret2");
    await user.click(screen.getByRole("button", { name: /Save new password/i }));

    expect(screen.getByText(/don't match/i)).toBeInTheDocument();
    expect(onUpdatePassword).not.toHaveBeenCalled();
  });

  it("saves a valid matching password", async () => {
    const user = userEvent.setup();
    const onUpdatePassword = vi.fn().mockResolvedValue({ error: null });
    render(<UpdatePasswordScreen onUpdatePassword={onUpdatePassword} />);

    await user.type(screen.getByPlaceholderText(/At least 6/i), "newpass1");
    await user.type(screen.getByPlaceholderText(/Re-enter it/i), "newpass1");
    await user.click(screen.getByRole("button", { name: /Save new password/i }));

    expect(onUpdatePassword).toHaveBeenCalledWith("newpass1");
  });
});
