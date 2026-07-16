import { useState } from "react";

import { appBaseUrl } from "../lib/household";

// Share the app: the native share sheet where available (phones), otherwise
// copy a link + "add to home screen" tip to the clipboard. `shareStatus` briefly
// holds a confirmation for the copy fallback so a small toast can show it.
// Shared by the header share button and the Settings "Share this app" action.
export function useShareApp() {
  const [shareStatus, setShareStatus] = useState(null);

  async function shareApp() {
    const url = appBaseUrl();
    const text =
      "Weekly meal planner — plan meals and build a shopping list. " +
      "Open the link, then add it to your home screen to use it like an app " +
      "(on iPhone: tap Share, then Add to Home Screen).";
    if (navigator.share) {
      try {
        await navigator.share({ title: "Weekly meal planner", text, url });
        return;
      } catch {
        // Cancelled or unsupported — fall back to copying the link.
      }
    }
    try {
      // Copy the note with the link so the install tip travels too.
      await navigator.clipboard.writeText(`${text}\n${url}`);
      setShareStatus("Link copied.");
      window.setTimeout(() => setShareStatus(null), 2000);
    } catch {
      // Clipboard blocked; nothing else to do.
    }
  }

  return { shareApp, shareStatus };
}
