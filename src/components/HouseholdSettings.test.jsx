// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";

import HouseholdSettings from "./HouseholdSettings";
import * as household from "../lib/household";

vi.mock("../lib/household", () => ({
  createInvite: vi.fn(),
  joinHousehold: vi.fn(),
  leaveHousehold: vi.fn(),
  removeMember: vi.fn(),
  disbandHousehold: vi.fn(),
  friendlyHouseholdError: () => "Something went wrong.",
  inviteLink: (code) => `https://app.example/?join=${code}`,
  inviteMessage: (code) => `Join my planner. Code: ${code}`,
  clearPendingJoinCode: vi.fn(),
}));

function makeHousehold(overrides = {}) {
  return {
    ownerId: "me",
    role: "owner",
    isShared: false,
    members: [],
    available: true,
    currentUserId: "me",
    refresh: vi.fn().mockResolvedValue(),
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("HouseholdSettings", () => {
  it("renders nothing when not signed in to cloud", () => {
    const { container } = render(
      <HouseholdSettings household={makeHousehold()} cloud={false} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("explains the setup when the backend isn't enabled", () => {
    render(
      <HouseholdSettings
        household={makeHousehold({ available: false })}
        cloud
      />
    );
    expect(screen.getByText(/isn't enabled on the server/i)).toBeInTheDocument();
  });

  it("generates and shows an invite code", async () => {
    const user = userEvent.setup();
    household.createInvite.mockResolvedValue("4F9A2C");
    const hh = makeHousehold();

    render(<HouseholdSettings household={hh} cloud />);

    await user.click(screen.getByRole("button", { name: /Invite someone/i }));

    expect(household.createInvite).toHaveBeenCalled();
    await waitFor(() => expect(hh.refresh).toHaveBeenCalled());
    expect(await screen.findByText("4F9A2C")).toBeInTheDocument();
  });

  it("shares the invite via the native share sheet when available", async () => {
    const user = userEvent.setup();
    household.createInvite.mockResolvedValue("4F9A2C");
    const share = vi.fn().mockResolvedValue();
    vi.stubGlobal("navigator", { ...navigator, share });

    render(<HouseholdSettings household={makeHousehold()} cloud />);

    await user.click(screen.getByRole("button", { name: /Invite someone/i }));
    await screen.findByText("4F9A2C");
    await user.click(screen.getByRole("button", { name: /Share invite/i }));

    expect(share).toHaveBeenCalledWith(
      expect.objectContaining({ url: "https://app.example/?join=4F9A2C" })
    );
    vi.unstubAllGlobals();
  });

  it("prefills the join field from an invite link code", () => {
    render(
      <HouseholdSettings household={makeHousehold()} cloud pendingJoinCode="ZZ9Z9Z" />
    );
    expect(screen.getByPlaceholderText(/4F9A2C/i)).toHaveValue("ZZ9Z9Z");
  });

  it("joins with a code and refreshes", async () => {
    const user = userEvent.setup();
    household.joinHousehold.mockResolvedValue("owner-1");
    const hh = makeHousehold();
    const onJoined = vi.fn();

    render(<HouseholdSettings household={hh} cloud onJoined={onJoined} />);

    await user.type(screen.getByPlaceholderText(/4F9A2C/i), "abc123");
    await user.click(screen.getByRole("button", { name: /^Join/i }));

    expect(household.joinHousehold).toHaveBeenCalledWith("abc123");
    await waitFor(() => expect(hh.refresh).toHaveBeenCalled());
    expect(onJoined).toHaveBeenCalled();
  });

  it("lists members and lets the owner remove one", async () => {
    const user = userEvent.setup();
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const hh = makeHousehold({
      isShared: true,
      members: [
        { memberId: "me", email: "me@example.com", role: "owner" },
        { memberId: "them", email: "them@example.com", role: "member" },
      ],
    });

    render(<HouseholdSettings household={hh} cloud />);

    expect(screen.getByText(/me@example.com/)).toBeInTheDocument();
    expect(screen.getByText(/them@example.com/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Remove/i }));
    expect(household.removeMember).toHaveBeenCalledWith("them");
  });

  it("lets a member leave", async () => {
    const user = userEvent.setup();
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const hh = makeHousehold({
      role: "member",
      isShared: true,
      members: [
        { memberId: "owner", email: "owner@example.com", role: "owner" },
        { memberId: "me", email: "me@example.com", role: "member" },
      ],
    });

    render(<HouseholdSettings household={hh} cloud />);

    await user.click(screen.getByRole("button", { name: /Leave household/i }));
    expect(household.leaveHousehold).toHaveBeenCalled();
  });
});
