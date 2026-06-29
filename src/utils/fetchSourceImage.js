// Look up a recipe page's preview image (its og:image) for recipes that link
// out to a source site. The browser can't read another site's HTML directly
// (cross-origin), so this goes through Microlink's free, CORS-friendly
// link-preview API and returns the image URL it reports.
//
// Runs on the user's device/network — not the build sandbox, which is blocked
// from reaching recipe sites.
export async function fetchSourceImage(sourceUrl) {
  const url = (sourceUrl || "").trim();
  if (!url) return null;

  const endpoint = `https://api.microlink.io/?url=${encodeURIComponent(url)}`;
  const response = await fetch(endpoint);

  if (!response.ok) {
    throw new Error(`Preview service returned ${response.status}`);
  }

  const body = await response.json();
  if (body.status !== "success") {
    throw new Error("No preview available for this page");
  }

  const image = body.data?.image?.url || body.data?.logo?.url || "";
  if (!image) {
    throw new Error("No image found on the source page");
  }

  return image;
}
