import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { supabase, isSupabaseConfigured } from "../lib/supabase";
import {
  defaultData,
  normaliseData,
  loadLocalData,
  saveLocalData,
  hasLocalData,
  fetchCloudData,
  saveCloudData,
} from "../lib/plannerData";
import { demoData } from "../lib/demoData";
import {
  loadSnapshots,
  saveSnapshots,
  addSnapshot,
  makeSnapshot,
  shouldAutoSnapshot,
  AUTO_SNAPSHOT_GAP_MS,
} from "../lib/recoverySnapshots";

const SAVE_DEBOUNCE_MS = 800;

// Single source of truth for all planner data. In cloud mode (Supabase
// configured + signed in) it loads/saves the user's row and refreshes on focus;
// otherwise it falls back to localStorage. Guest mode is ephemeral: it shows a
// populated demo held in memory only, never read from or written to storage, so
// it can't pollute a real account. It exposes the same per-slice setters the
// app already used, so the rest of the UI is unchanged.
export function usePlannerStore(user, guest = false, dataOwnerId) {
  const cloud = isSupabaseConfigured && Boolean(user);
  const userId = user?.id ?? null;
  // The row we actually read/write. In a shared household this is the owner's
  // id; otherwise it's the user's own id. Defaults to the user's id so callers
  // that don't pass it (and all existing behaviour) are unchanged.
  const dataKey = dataOwnerId ?? userId;

  const [data, setData] = useState(loadLocalData);
  const [loadedKey, setLoadedKey] = useState(null);
  const [syncError, setSyncError] = useState(false);

  // Derived: we're loading whenever we're in cloud mode but the data on screen
  // isn't yet for the current data row. (Derived, so we never setState in an
  // effect just to flip a loading flag.)
  const loading = cloud && loadedKey !== dataKey;

  // Skip the very next autosave after we *load* data (so loading doesn't
  // immediately write the same data straight back out).
  const skipNextSaveRef = useRef(true);
  const saveTimerRef = useRef(null);
  // updated_at of our most recent write, so realtime can ignore our own echo.
  const lastWrittenAtRef = useRef(null);
  // Detects sign-out so we can drop the account's in-memory data.
  const prevUserIdRef = useRef(userId);
  // Detects entering/leaving guest mode so we can swap in (and later discard)
  // the in-memory demo without ever touching storage.
  const prevGuestRef = useRef(guest);
  // Throttles the auto-snapshot check so it doesn't read storage on every edit.
  const lastAutoSnapshotRef = useRef(0);
  // Latest data, so the focus / realtime handlers can diff against what's on
  // screen without depending on (and re-subscribing per) every edit.
  const dataRef = useRef(data);
  // Whether we hold local edits not yet written to the cloud — so an incoming
  // remote change defers to a prompt instead of silently overwriting them.
  const dirtyRef = useRef(false);
  // A remote version that landed while we had unsaved edits, parked until the
  // user chooses to take it or keep editing.
  const [remoteUpdate, setRemoteUpdate] = useState(null);

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  // Apply a freshly fetched / pushed remote row. No-ops when it matches what we
  // already have (which also absorbs the echo of our own write). If we have
  // unsaved local edits it parks the remote copy for the user to resolve rather
  // than clobbering their work; otherwise (the common "edited on another
  // device" case) it applies straight away.
  const receiveRemote = useCallback((remote) => {
    if (!remote) return;
    const normalised = normaliseData(remote);
    if (JSON.stringify(normalised) === JSON.stringify(dataRef.current)) return;

    if (dirtyRef.current) {
      setRemoteUpdate(normalised);
    } else {
      skipNextSaveRef.current = true;
      setData(normalised);
    }
  }, []);

  // Load from the cloud (state updates happen inside the async callback, never
  // synchronously in the effect body).
  useEffect(() => {
    if (!cloud) return;

    let cancelled = false;

    (async () => {
      setSyncError(false);
      try {
        const remote = await fetchCloudData(dataKey);
        if (cancelled) return;

        if (remote) {
          skipNextSaveRef.current = true;
          setData(normaliseData(remote));
        } else {
          // First sign-in: seed the account from existing local data if there
          // is any on this device, otherwise from the bundled defaults.
          const seed = hasLocalData() ? loadLocalData() : defaultData();
          const writtenAt = await saveCloudData(dataKey, seed);
          if (cancelled) return;
          lastWrittenAtRef.current = writtenAt;
          skipNextSaveRef.current = true;
          setData(normaliseData(seed));
        }

        setLoadedKey(dataKey);
      } catch {
        if (cancelled) return;
        // Surface the error but stop blocking on the loading screen.
        setSyncError(true);
        setLoadedKey(dataKey);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [cloud, dataKey]);

  // On sign-out, discard the account's in-memory data so guest / local mode
  // starts fresh from defaults instead of showing (or writing locally) the
  // previous account's plan. Defined before the save effect so the skip flag is
  // already set when that effect runs in the same pass.
  useEffect(() => {
    const prevUserId = prevUserIdRef.current;
    prevUserIdRef.current = userId;

    if (prevUserId && !userId) {
      skipNextSaveRef.current = true;
      setData(defaultData());
      setLoadedKey(null);
    }
  }, [userId]);

  // Enter guest mode -> show the in-memory demo; leave it -> fall back to
  // whatever's in local storage (defaults on a fresh device). Never persisted.
  useEffect(() => {
    const wasGuest = prevGuestRef.current;
    prevGuestRef.current = guest;

    if (guest === wasGuest) return;

    skipNextSaveRef.current = true;
    setData(guest ? demoData() : loadLocalData());
  }, [guest]);

  // Persist on change: debounced upsert in cloud mode, immediate in local mode.
  useEffect(() => {
    if (loading) return;

    // Guest/demo is in-memory only — never write it anywhere.
    if (guest) return;

    if (skipNextSaveRef.current) {
      skipNextSaveRef.current = false;
      return;
    }

    if (!cloud) {
      saveLocalData(data);
      return;
    }

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    // A real edit is queued but not yet persisted — mark us dirty so an
    // incoming remote change won't silently overwrite it.
    dirtyRef.current = true;
    saveTimerRef.current = setTimeout(() => {
      saveCloudData(dataKey, data)
        .then((writtenAt) => {
          lastWrittenAtRef.current = writtenAt;
          dirtyRef.current = false;
        })
        .catch(() => setSyncError(true));
    }, SAVE_DEBOUNCE_MS);

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [data, cloud, loading, dataKey, guest]);

  // When you return to the app, pull the latest (e.g. edited on another device).
  useEffect(() => {
    if (!cloud) return;

    function handleFocus() {
      fetchCloudData(dataKey)
        .then((remote) => receiveRemote(remote))
        .catch(() => {});
    }

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [cloud, dataKey, receiveRemote]);

  // Live updates: when another device writes our row, reflect it immediately.
  // (Requires the table to be in the supabase_realtime publication; if it's not,
  // this simply never fires and focus-refresh above still keeps things current.)
  useEffect(() => {
    if (!cloud) return;

    const channel = supabase
      .channel(`app_data:${dataKey}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "app_data",
          filter: `user_id=eq.${dataKey}`,
        },
        (payload) => {
          const row = payload.new;
          if (!row || !row.data) return;
          // Ignore the echo of our own write.
          if (row.updated_at && row.updated_at === lastWrittenAtRef.current) {
            return;
          }
          receiveRemote(row.data);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [cloud, dataKey, receiveRemote]);

  // Auto-capture a recovery point when the app is in a settled state, throttled
  // so edits don't pile up snapshots. Reads `data` and writes localStorage only
  // — never touches React state or the synced data.
  useEffect(() => {
    if (loading || guest) return;

    const now = Date.now();
    // Cheap in-memory gate first, so editing doesn't touch storage every change.
    if (now - lastAutoSnapshotRef.current < AUTO_SNAPSHOT_GAP_MS) return;
    lastAutoSnapshotRef.current = now;

    const current = loadSnapshots();
    if (!shouldAutoSnapshot(current, now)) return;
    saveSnapshots(addSnapshot(current, makeSnapshot("Auto-saved", data)));
  }, [data, loading, guest]);

  // Take a recovery point immediately (used before destructive actions like an
  // import or a reset, which would otherwise be unrecoverable).
  function captureRecoverySnapshot(label) {
    saveSnapshots(addSnapshot(loadSnapshots(), makeSnapshot(label, data)));
  }

  // Roll back to a snapshot. This is a normal data change, so it syncs to the
  // cloud like any other edit.
  function restoreRecoverySnapshot(id) {
    const snapshot = loadSnapshots().find((entry) => entry.id === id);
    if (!snapshot) return false;
    // Keep a point for the state we're leaving, so a restore is itself undoable.
    captureRecoverySnapshot("Before restoring a recovery point");
    skipNextSaveRef.current = false;
    setData(normaliseData(snapshot.data));
    return true;
  }

  // Resolve a parked remote update: take the other device's version, dropping
  // the unsaved local edits that were holding it back.
  function applyRemoteUpdate() {
    if (!remoteUpdate) return;
    skipNextSaveRef.current = true;
    setData(remoteUpdate);
    dirtyRef.current = false;
    setRemoteUpdate(null);
  }

  // Dismiss it and keep editing; the local version stays and will sync, winning.
  function dismissRemoteUpdate() {
    setRemoteUpdate(null);
  }

  const setters = useMemo(() => {
    function makeSetter(key) {
      return (next) =>
        setData((current) => ({
          ...current,
          [key]: typeof next === "function" ? next(current[key]) : next,
        }));
    }

    return {
      setMealsByWeek: makeSetter("mealsByWeek"),
      setShoppingItemsByWeek: makeSetter("shoppingItemsByWeek"),
      setShoppingListMetaByWeek: makeSetter("shoppingListMetaByWeek"),
      setRemovalAcksByWeek: makeSetter("removalAcksByWeek"),
      setRecurringCheckedByWeek: makeSetter("recurringCheckedByWeek"),
      setShoppingChecked: makeSetter("shoppingChecked"),
      setManualShoppingItems: makeSetter("manualShoppingItems"),
      setStaples: makeSetter("staples"),
      setBaskets: makeSetter("baskets"),
      setInventory: makeSetter("inventory"),
      setRecipes: makeSetter("recipes"),
      setSettings: makeSetter("settings"),
      setIngredientGroups: makeSetter("ingredientGroups"),
    };
  }, []);

  return {
    ...data,
    ...setters,
    loading,
    syncError,
    cloud,
    remoteUpdatePending: Boolean(remoteUpdate),
    applyRemoteUpdate,
    dismissRemoteUpdate,
    getRecoverySnapshots: loadSnapshots,
    captureRecoverySnapshot,
    restoreRecoverySnapshot,
  };
}
