// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";

// A controllable Supabase: capture the realtime postgres_changes callback so a
// test can emit a remote write, and report cloud mode as configured.
const realtime = vi.hoisted(() => ({ emit: null }));

vi.mock("../lib/supabase", () => {
  const channel = {
    on: (_event, _config, cb) => {
      realtime.emit = (row) => cb({ new: row });
      return channel;
    },
    subscribe: () => channel,
  };
  return {
    isSupabaseConfigured: true,
    supabase: { channel: () => channel, removeChannel: () => {} },
  };
});

// Real data normalisation / local helpers; only the network calls are stubbed.
vi.mock("../lib/plannerData", async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, fetchCloudData: vi.fn(), saveCloudData: vi.fn() };
});

import { usePlannerStore } from "./usePlannerStore";
import { fetchCloudData, saveCloudData } from "../lib/plannerData";

const USER = { id: "user-1" };
const staple = (id, name) => ({ id, name, category: "Other" });
const names = (list) => list.map((item) => item.name);

beforeEach(() => {
  localStorage.clear();
  realtime.emit = null;
  fetchCloudData.mockReset();
  saveCloudData.mockReset().mockResolvedValue("2026-01-01T00:00:00.000Z");
});

// Render the store in cloud mode and wait for the initial load to settle.
async function loadStore(remote) {
  fetchCloudData.mockResolvedValue(remote);
  const view = renderHook(() => usePlannerStore(USER, false));
  await waitFor(() => expect(view.result.current.loading).toBe(false));
  return view;
}

describe("usePlannerStore cloud sync conflicts", () => {
  it("applies a remote change immediately when there are no unsaved edits", async () => {
    const { result } = await loadStore({ staples: [staple("s1", "Milk")] });
    expect(names(result.current.staples)).toEqual(["Milk"]);

    act(() => {
      realtime.emit({
        data: { staples: [staple("s2", "Eggs")] },
        updated_at: "remote-ts",
      });
    });

    expect(result.current.remoteUpdatePending).toBe(false);
    expect(names(result.current.staples)).toEqual(["Eggs"]);
  });

  it("parks a remote change while there are unsaved edits, and keeps local on dismiss", async () => {
    const { result } = await loadStore({ staples: [staple("s1", "Milk")] });

    // A local edit queues a (not-yet-resolved) cloud save, so we're now dirty.
    act(() => {
      result.current.setStaples([staple("s1", "Milk"), staple("s3", "Bread")]);
    });

    act(() => {
      realtime.emit({
        data: { staples: [staple("s9", "Cheese")] },
        updated_at: "remote-ts",
      });
    });

    // The remote write is parked, not applied — local edits are untouched.
    expect(result.current.remoteUpdatePending).toBe(true);
    expect(names(result.current.staples)).toEqual(["Milk", "Bread"]);

    act(() => result.current.dismissRemoteUpdate());
    expect(result.current.remoteUpdatePending).toBe(false);
    expect(names(result.current.staples)).toEqual(["Milk", "Bread"]);
  });

  it("applies the parked remote version when the user chooses to", async () => {
    const { result } = await loadStore({ staples: [staple("s1", "Milk")] });

    act(() => {
      result.current.setStaples([staple("s1", "Milk"), staple("s3", "Bread")]);
    });
    act(() => {
      realtime.emit({
        data: { staples: [staple("s9", "Cheese")] },
        updated_at: "remote-ts",
      });
    });
    expect(result.current.remoteUpdatePending).toBe(true);

    act(() => result.current.applyRemoteUpdate());
    expect(result.current.remoteUpdatePending).toBe(false);
    expect(names(result.current.staples)).toEqual(["Cheese"]);
  });

  it("ignores a remote echo identical to the current data", async () => {
    const { result } = await loadStore({ staples: [staple("s1", "Milk")] });

    act(() => {
      // Same payload we already hold — e.g. the echo of our own write.
      realtime.emit({
        data: { staples: [staple("s1", "Milk")] },
        updated_at: "remote-ts",
      });
    });

    expect(result.current.remoteUpdatePending).toBe(false);
    expect(names(result.current.staples)).toEqual(["Milk"]);
  });
});
