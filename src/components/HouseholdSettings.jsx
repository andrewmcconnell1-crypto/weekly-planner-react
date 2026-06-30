import { useState } from "react";
import { Copy, Check, UserPlus, LogIn, Share2 } from "lucide-react";

import {
  createInvite,
  joinHousehold,
  leaveHousehold,
  removeMember,
  disbandHousehold,
  friendlyHouseholdError,
  inviteLink,
  inviteMessage,
  clearPendingJoinCode,
} from "../lib/household";

// The "Household" section of Settings: invite a partner by code, join with a
// code, see who's in the household, and leave / remove. Mutations go through
// the lib (which calls the Supabase RPCs), then refresh the household so the
// app re-points at the shared (or, after leaving, the solo) data row.
//
// `household` is the useHousehold() result: { ownerId, role, isShared,
// members, available, currentUserId, refresh }.
function HouseholdSettings({ household, cloud, pendingJoinCode, onJoined }) {
  const [code, setCode] = useState(null); // the invite code we generated
  // Prefilled from a ?join= invite link when the recipient opened the app.
  const [joinCode, setJoinCode] = useState(pendingJoinCode || "");
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState(null); // { tone, message }

  // Only meaningful when signed in to a real account.
  if (!cloud) return null;

  const { members, role, isShared, available, currentUserId, refresh } =
    household;
  const isOwner = role === "owner";

  async function run(action, okMessage) {
    if (busy) return;
    setBusy(true);
    setStatus(null);
    try {
      const result = await action();
      await refresh();
      if (okMessage) setStatus({ tone: "ok", message: okMessage });
      return result;
    } catch (error) {
      setStatus({ tone: "error", message: friendlyHouseholdError(error) });
    } finally {
      setBusy(false);
    }
  }

  async function handleInvite() {
    const newCode = await run(createInvite);
    if (newCode) {
      setCode(newCode);
      setCopied(false);
    }
  }

  // One-tap share: the native share sheet (phones) with the link + code, or a
  // clipboard copy of the same message as a desktop fallback.
  async function handleShare() {
    const text = inviteMessage(code);
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join my meal planner",
          text,
          url: inviteLink(code),
        });
        return;
      } catch {
        // Cancelled or unsupported payload — fall back to copying.
      }
    }
    try {
      await navigator.clipboard.writeText(text);
      setStatus({
        tone: "ok",
        message: "Invite copied — paste it to your partner.",
      });
    } catch {
      // Clipboard blocked; the link and code are shown to copy by hand.
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(inviteMessage(code));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard may be blocked; the code is shown to copy by hand.
    }
  }

  async function handleJoin(event) {
    event.preventDefault();
    const trimmed = joinCode.trim();
    if (!trimmed) return;
    const ownerId = await run(
      () => joinHousehold(trimmed),
      "Joined — you're now sharing this household's plan."
    );
    if (ownerId) {
      setJoinCode("");
      setCode(null);
      clearPendingJoinCode();
      onJoined?.();
    }
  }

  function handleLeave() {
    const ok = window.confirm(
      "Leave this household? You'll go back to your own separate plan — the shared data stays with the others."
    );
    if (ok) run(leaveHousehold, "You've left the household.");
  }

  function handleDisband() {
    const ok = window.confirm(
      "Disband this household? Everyone goes back to their own separate plan. The data stays on your account."
    );
    if (ok) run(disbandHousehold, "Household disbanded.");
  }

  function handleRemove(memberId) {
    const ok = window.confirm("Remove this person from your household?");
    if (ok) run(() => removeMember(memberId), "Removed.");
  }

  return (
    <section className="settings-group household-settings">
      <strong>Household sharing</strong>
      <p className="small-text">
        Share one planner — the same meals, shopping list and stock — with your
        partner or housemates. Everyone keeps their own login.
      </p>

      {!available && (
        <p className="small-text settings-status settings-status-error">
          Household sharing isn't enabled on the server yet. Once the one-time
          database setup is applied, this section becomes active.
        </p>
      )}

      {available && (
        <>
          {isShared && (
            <ul className="household-members">
              {members.map((member) => {
                const isYou = member.memberId === currentUserId;
                return (
                  <li className="household-member" key={member.memberId}>
                    <span className="household-member-main">
                      <strong>
                        {member.email || "Member"}
                        {isYou && " (you)"}
                      </strong>
                      <span className="small-text">
                        {member.role === "owner" ? "Owner" : "Member"}
                      </span>
                    </span>

                    {isOwner && !isYou && (
                      <button
                        type="button"
                        className="secondary"
                        disabled={busy}
                        onClick={() => handleRemove(member.memberId)}
                      >
                        Remove
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          {/* Invite: owners and solo users can generate a code. */}
          {isOwner && (
            <div className="household-block">
              <div className="settings-actions">
                <button
                  type="button"
                  className="secondary with-icon"
                  disabled={busy}
                  onClick={handleInvite}
                >
                  <UserPlus size={15} aria-hidden="true" />
                  {isShared ? "New invite code" : "Invite someone"}
                </button>
              </div>

              {code && (
                <>
                  <div className="household-code">
                    <code>{code}</code>
                  </div>

                  <div className="settings-actions">
                    <button
                      type="button"
                      className="primary-button with-icon"
                      onClick={handleShare}
                    >
                      <Share2 size={15} aria-hidden="true" />
                      Share invite
                    </button>

                    <button
                      type="button"
                      className="secondary with-icon"
                      onClick={handleCopy}
                    >
                      {copied ? (
                        <>
                          <Check size={15} aria-hidden="true" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy size={15} aria-hidden="true" />
                          Copy link &amp; code
                        </>
                      )}
                    </button>
                  </div>

                  <p className="small-text">
                    “Share invite” sends a message with a tap-to-join link and
                    the code {code}. Your partner signs in with their own
                    account and the link drops them straight onto the join
                    screen. The code expires in 7 days.
                  </p>
                </>
              )}
            </div>
          )}

          {/* Join: only offered when you're not already in a shared household. */}
          {!isShared && (
            <form className="household-block" onSubmit={handleJoin}>
              <label className="household-join-label" htmlFor="household-code">
                Got a code? Join their household
              </label>
              <div className="household-join-row">
                <input
                  id="household-code"
                  type="text"
                  autoCapitalize="characters"
                  autoComplete="off"
                  placeholder="e.g. 4F9A2C"
                  value={joinCode}
                  onChange={(event) => setJoinCode(event.target.value)}
                />
                <button
                  type="submit"
                  className="primary-button with-icon"
                  disabled={busy || !joinCode.trim()}
                >
                  <LogIn size={15} aria-hidden="true" />
                  Join
                </button>
              </div>
              <p className="small-text">
                Heads up: joining switches you to the shared plan. Your current
                solo plan is kept on your account and comes back if you leave.
              </p>
            </form>
          )}

          {/* Leave / disband. */}
          {isShared && (
            <div className="settings-actions">
              {isOwner ? (
                <button
                  type="button"
                  className="secondary"
                  disabled={busy}
                  onClick={handleDisband}
                >
                  Disband household
                </button>
              ) : (
                <button
                  type="button"
                  className="secondary"
                  disabled={busy}
                  onClick={handleLeave}
                >
                  Leave household
                </button>
              )}
            </div>
          )}

          {status && (
            <p
              className={`small-text settings-status ${
                status.tone === "error" ? "settings-status-error" : ""
              }`}
              role="status"
            >
              {status.message}
            </p>
          )}
        </>
      )}
    </section>
  );
}

export default HouseholdSettings;
