import { useEffect, useMemo, useRef, useState } from "react";

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

const SAVE_DEBOUNCE_MS = 800;

// Single source of truth for all planner data. In cloud mode (Supabase
// configured + signed in) it loads/saves the user's row and refreshes on focus;
// otherwise it falls back to localStorage. Guest mode is ephemeral: it shows a
// populated demo held in memory only, never read from or written to storage, so
// it can't pollute a real account. It exposes the same per-slice setters the
// app already used, so the rest of the UI is unchanged.
export function usePlannerStore(user, guest = false) {
  const cloud = isSupabaseConfigured && Boolean(user);
  const userId = user?.id ?? null;

  const [data, setData] = useState(loadLocalData);
  const [loadedUserId, setLoadedUserId] = useState(null);
  const [syncError, setSyncError] = useState(false);

  // Derived: we're loading whenever we're in cloud mode but the data on screen
  // isn't yet the current user's. (Derived, so we never setState in an effect
  // just to flip a loading flag.)
  const loading = cloud && loadedUserId !== userId;

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

  // Load from the cloud (state updates happen inside the async callback, never
  // synchronously in the effect body).
  useEffect(() => {
    if (!cloud) return;

    let cancelled = false;

    (async () => {
      setSyncError(false);
      try {
        const remote = await fetchCloudData(userId);
        if (cancelled) return;

        if (remote) {
          skipNextSaveRef.current = true;
          setData(normaliseData(remote));
        } else {
          // First sign-in: seed the account from existing local data if there
          // is any on this device, otherwise from the bundled defaults.
          const seed = hasLocalData() ? loadLocalData() : defaultData();
          const writtenAt = await saveCloudData(userId, seed);
          if (cancelled) return;
          lastWrittenAtRef.current = writtenAt;
          skipNextSaveRef.current = true;
          setData(normaliseData(seed));
        }

        setLoadedUserId(userId);
      } catch {
        if (cancelled) return;
        // Surface the error but stop blocking on the loading screen.
        setSyncError(true);
        setLoadedUserId(userId);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [cloud, userId]);

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
      setLoadedUserId(null);
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
    saveTimerRef.current = setTimeout(() => {
      saveCloudData(userId, data)
        .then((writtenAt) => {
          lastWrittenAtRef.current = writtenAt;
        })
        .catch(() => setSyncError(true));
    }, SAVE_DEBOUNCE_MS);

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [data, cloud, loading, userId, guest]);

  // When you return to the app, pull the latest (e.g. edited on another device).
  useEffect(() => {
    if (!cloud) return;

    function handleFocus() {
      fetchCloudData(userId)
        .then((remote) => {
          if (!remote) return;
          skipNextSaveRef.current = true;
          setData(normaliseData(remote));
        })
        .catch(() => {});
    }

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [cloud, userId]);

  // Live updates: when another device writes our row, reflect it immediately.
  // (Requires the table to be in the supabase_realtime publication; if it's not,
  // this simply never fires and focus-refresh above still keeps things current.)
  useEffect(() => {
    if (!cloud) return;

    const channel = supabase
      .channel(`app_data:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "app_data",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const row = payload.new;
          if (!row || !row.data) return;
          // Ignore the echo of our own write.
          if (row.updated_at && row.updated_at === lastWrittenAtRef.current) {
            return;
          }
          skipNextSaveRef.current = true;
          setData(normaliseData(row.data));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [cloud, userId]);

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
      setStaples: makeSetter("staples"),
      setInventory: makeSetter("inventory"),
      setRecipes: makeSetter("recipes"),
      setSettings: makeSetter("settings"),
    };
  }, []);

  return { ...data, ...setters, loading, syncError, cloud };
}
