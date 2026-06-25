// Device-local recovery points for the planner data. Supabase Free has no
// backups and a cloud save overwrites the single per-user row, so an accidental
// wipe (a thin backup import, a mistaken reset) is otherwise unrecoverable.
//
// These snapshots are stored separately from the synced data (their own
// localStorage key, never part of `data` and never written to the cloud), so
// the feature is purely additive — it can't corrupt or bloat the live data.

const STORAGE_KEY = "recoverySnapshots";

export const MAX_SNAPSHOTS = 4;
// Don't take an automatic snapshot more often than this (so opening/editing the
// app doesn't pile them up). One per half-day is plenty to roll back a mishap.
export const AUTO_SNAPSHOT_GAP_MS = 12 * 60 * 60 * 1000;

export function makeSnapshot(label, data, takenAt = Date.now()) {
  return {
    id: `snap-${takenAt}-${Math.random().toString(36).slice(2, 8)}`,
    label,
    takenAt,
    data,
  };
}

// Prepend a snapshot, newest first, keeping at most `max`.
export function addSnapshot(list, snapshot, max = MAX_SNAPSHOTS) {
  return [snapshot, ...list].slice(0, max);
}

// True when the newest snapshot is older than `gap` (or there are none), so the
// caller knows it's time for another automatic capture.
export function shouldAutoSnapshot(list, now = Date.now(), gap = AUTO_SNAPSHOT_GAP_MS) {
  if (!Array.isArray(list) || list.length === 0) return true;
  const newest = Math.max(...list.map((snapshot) => snapshot.takenAt || 0));
  return now - newest >= gap;
}

export function loadSnapshots() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveSnapshots(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    // Ignore quota / serialization errors — recovery points are best-effort.
  }
}
