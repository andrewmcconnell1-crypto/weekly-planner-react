import { describe, it, expect } from "vitest";

import { profileIdentity } from "./profile";

describe("profileIdentity", () => {
  it("uses the first letter of a Google display name", () => {
    const id = profileIdentity(
      { email: "sam@example.com", user_metadata: { full_name: "Sam Jones" } },
      false
    );
    expect(id.initial).toBe("S");
    expect(id.displayName).toBe("Sam Jones");
    expect(id.email).toBe("sam@example.com");
    expect(id.isGuest).toBe(false);
  });

  it("falls back to the email's first letter when there's no name", () => {
    const id = profileIdentity({ email: "andrew@example.com" }, false);
    expect(id.initial).toBe("A");
    expect(id.displayName).toBeNull();
  });

  it("gives a stable tone for the same account and a valid range", () => {
    const a = profileIdentity({ email: "andrew@example.com" }, false);
    const b = profileIdentity({ email: "andrew@example.com" }, false);
    expect(a.tone).toBe(b.tone);
    expect(a.tone).toBeGreaterThanOrEqual(0);
    expect(a.tone).toBeLessThan(5);
  });

  it("marks guests and missing users as neutral with no initial", () => {
    expect(profileIdentity(null, true).isGuest).toBe(true);
    expect(profileIdentity(null, true).initial).toBeNull();
    expect(profileIdentity(null, false).isGuest).toBe(true);
  });
});
