// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";

import SignInScreen from "./SignInScreen";

function setup(props = {}) {
  const handlers = {
    onGoogle: vi.fn(),
    onEmailSignIn: vi.fn().mockResolvedValue({ data: {}, error: null }),
    onEmailSignUp: vi.fn().mockResolvedValue({ data: {}, error: null }),
    onMagicLink: vi.fn().mockResolvedValue({ error: null }),
    onResetPassword: vi.fn().mockResolvedValue({ error: null }),
    onResendConfirmation: vi.fn().mockResolvedValue({ error: null }),
    onGuest: vi.fn(),
  };
  render(<SignInScreen {...handlers} {...props} />);
  return handlers;
}

describe("SignInScreen", () => {
  it("sends a password reset link from the forgot-password form", async () => {
    const user = userEvent.setup();
    const { onResetPassword } = setup();

    await user.click(screen.getByRole("button", { name: /Forgot your password/i }));
    await user.type(screen.getByPlaceholderText("you@example.com"), "her@example.com");
    await user.click(
      screen.getByRole("button", { name: /Send password reset link/i })
    );

    expect(onResetPassword).toHaveBeenCalledWith("her@example.com");
    expect(await screen.findByText(/reset link sent/i)).toBeInTheDocument();
  });

  it("offers to resend confirmation when the email isn't confirmed", async () => {
    const user = userEvent.setup();
    const onEmailSignIn = vi
      .fn()
      .mockResolvedValue({ error: { message: "Email not confirmed" } });
    const { onResendConfirmation } = setup({ onEmailSignIn });

    await user.type(screen.getByPlaceholderText("you@example.com"), "her@example.com");
    await user.type(screen.getByPlaceholderText("Your password"), "secret1");
    await user.click(screen.getByRole("button", { name: /^Sign in$/i }));

    expect(await screen.findByText(/isn't confirmed yet/i)).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: /Resend confirmation email/i })
    );
    expect(onResendConfirmation).toHaveBeenCalledWith("her@example.com");
  });
});
