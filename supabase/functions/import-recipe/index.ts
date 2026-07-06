// import-recipe: fetch a public recipe page server-side (the browser can't —
// CORS) and return its JSON-LD blocks plus the site name. All interpretation
// of the structured data happens in the app (src/utils/recipeImport.js) so the
// parsing logic stays unit-tested and this function almost never changes.
//
// Deploy:  supabase functions deploy import-recipe
// The function runs with JWT verification on (the default), so only callers
// holding this project's anon key (i.e. the app) can use it.

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const MAX_HTML_BYTES = 2_500_000;
const FETCH_TIMEOUT_MS = 10_000;

function json(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

// Reject obviously-internal targets so the function can't be used to probe
// the network it runs in.
function isBlockedHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  if (host === "localhost" || host.endsWith(".local") || host.endsWith(".internal")) {
    return true;
  }
  if (/^\d+\.\d+\.\d+\.\d+$/.test(host)) {
    const [a, b] = host.split(".").map(Number);
    if (a === 10 || a === 127 || a === 0) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 169 && b === 254) return true;
  }
  return host === "::1" || host.startsWith("[");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }
  if (req.method !== "POST") {
    return json(405, { error: "POST a JSON body of { url }." });
  }

  let url: URL;
  try {
    const body = await req.json();
    url = new URL(String(body?.url ?? ""));
  } catch {
    return json(400, { error: "That doesn't look like a valid link." });
  }
  if (!["http:", "https:"].includes(url.protocol) || isBlockedHost(url.hostname)) {
    return json(400, { error: "Only public http(s) links can be imported." });
  }

  let response: Response;
  try {
    response = await fetch(url, {
      redirect: "follow",
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: {
        // A browser-ish UA: some sites serve bots a page without the recipe.
        "User-Agent":
          "Mozilla/5.0 (compatible; LadleRecipeImport/1.0; +https://github.com/andrewmcconnell1-crypto/weekly-planner-react)",
        Accept: "text/html,application/xhtml+xml",
      },
    });
  } catch {
    return json(502, { error: "Couldn't reach that page." });
  }
  if (!response.ok) {
    return json(502, { error: `The site answered with ${response.status}.` });
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("html")) {
    return json(415, { error: "That link isn't a web page." });
  }

  const html = (await response.text()).slice(0, MAX_HTML_BYTES);

  const jsonLd: string[] = [];
  const scriptPattern =
    /<script[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;
  while ((match = scriptPattern.exec(html)) !== null) {
    jsonLd.push(match[1]);
  }

  const siteNameMatch =
    /<meta[^>]+property\s*=\s*["']og:site_name["'][^>]*content\s*=\s*["']([^"']*)["']/i.exec(html) ??
    /<meta[^>]+content\s*=\s*["']([^"']*)["'][^>]*property\s*=\s*["']og:site_name["']/i.exec(html);

  return json(200, {
    jsonLd,
    siteName: siteNameMatch?.[1] ?? "",
    url: response.url || url.href,
  });
});
