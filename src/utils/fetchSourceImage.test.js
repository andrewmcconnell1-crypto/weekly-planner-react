import { describe, it, expect, vi, afterEach } from "vitest";

import { fetchSourceImage } from "./fetchSourceImage";

afterEach(() => {
  vi.unstubAllGlobals();
});

function stubFetch(payload, { ok = true, status = 200 } = {}) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok,
    status,
    json: async () => payload,
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("fetchSourceImage", () => {
  it("returns null for a blank url without calling out", async () => {
    const fetchMock = stubFetch({});
    expect(await fetchSourceImage("")).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns the preview image url on success", async () => {
    stubFetch({ status: "success", data: { image: { url: "https://x/y.jpg" } } });
    expect(await fetchSourceImage("https://recipes/x")).toBe("https://x/y.jpg");
  });

  it("throws when the page has no image", async () => {
    stubFetch({ status: "success", data: {} });
    await expect(fetchSourceImage("https://recipes/x")).rejects.toThrow();
  });

  it("throws on a non-ok response (e.g. rate limited)", async () => {
    stubFetch({}, { ok: false, status: 429 });
    await expect(fetchSourceImage("https://recipes/x")).rejects.toThrow();
  });
});
