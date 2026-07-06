// Turn a recipe page's schema.org JSON-LD into this app's recipe shape.
//
// Nearly every recipe site embeds a schema.org/Recipe block as JSON-LD (Google
// requires it for rich results), so import is structured-data mapping, not
// scraping. The import-recipe edge function fetches the page server-side (the
// browser can't, because of CORS) and returns the raw JSON-LD strings; this
// module does all the interpretation so it stays unit-testable.

// Common HTML entities that survive JSON parsing inside text fields, plus tag
// stripping — some sites embed markup in instruction text. No DOM dependency.
function cleanText(value) {
  return String(value ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isRecipeNode(node) {
  if (!node || typeof node !== "object") return false;
  const type = node["@type"];
  const types = Array.isArray(type) ? type : [type];
  return types.some((t) => String(t).toLowerCase() === "recipe");
}

// Find the schema.org Recipe node across the shapes sites actually use: a
// bare object, a top-level array, or nodes nested under @graph.
export function findRecipeNode(jsonLdBlocks) {
  for (const block of jsonLdBlocks || []) {
    let parsed;
    try {
      parsed = typeof block === "string" ? JSON.parse(block) : block;
    } catch {
      continue; // malformed block — try the next one
    }

    const candidates = [];
    const queue = Array.isArray(parsed) ? [...parsed] : [parsed];
    for (const node of queue) {
      if (!node || typeof node !== "object") continue;
      candidates.push(node);
      if (Array.isArray(node["@graph"])) candidates.push(...node["@graph"]);
    }

    const recipe = candidates.find(isRecipeNode);
    if (recipe) return recipe;
  }
  return null;
}

// "PT1H30M" → 90. Returns null for anything unparseable.
export function parseIsoDurationMins(value) {
  const match = /^-?P(?:(\d+(?:\.\d+)?)D)?(?:T(?:(\d+(?:\.\d+)?)H)?(?:(\d+(?:\.\d+)?)M)?(?:(\d+(?:\.\d+)?)S)?)?$/.exec(
    String(value ?? "").trim()
  );
  if (!match || (!match[1] && !match[2] && !match[3] && !match[4])) return null;
  const [, days, hours, mins, secs] = match.map((part) =>
    part ? Number(part) : 0
  );
  const total = Math.round(days * 24 * 60 + hours * 60 + mins + secs / 60);
  return total > 0 ? total : null;
}

// recipeYield arrives as 4, "4", "4 servings", "Serves 4-6", or an array of
// those. Take the first sensible number.
function parseYield(value) {
  const first = Array.isArray(value) ? value[0] : value;
  const match = /\d+/.exec(String(first ?? ""));
  if (!match) return null;
  const serves = Number(match[0]);
  return serves >= 1 && serves <= 50 ? serves : null;
}

// recipeInstructions arrives as one string, an array of strings, an array of
// HowToStep objects, or HowToSections wrapping more steps. Flatten to a list
// of plain step texts.
function flattenInstructions(value) {
  if (!value) return [];
  if (typeof value === "string") {
    // A single blob: split on newlines; keep it whole if it doesn't split.
    return value
      .split(/\n+/)
      .map(cleanText)
      .filter(Boolean);
  }

  const steps = [];
  const queue = Array.isArray(value) ? [...value] : [value];
  for (const entry of queue) {
    if (!entry) continue;
    if (typeof entry === "string") {
      const text = cleanText(entry);
      if (text) steps.push(text);
      continue;
    }
    if (Array.isArray(entry.itemListElement)) {
      queue.push(...entry.itemListElement); // HowToSection
      continue;
    }
    const text = cleanText(entry.text || entry.name || "");
    if (text) steps.push(text);
  }
  return steps;
}

// Map a schema.org Recipe node to this app's recipe fields. Returns null when
// the node is missing the essentials (a name plus ingredients).
export function normaliseImportedRecipe(node, { url = "", siteName = "" } = {}) {
  if (!isRecipeNode(node)) return null;

  const name = cleanText(node.name);
  const ingredients = (node.recipeIngredient || node.ingredients || [])
    .map(cleanText)
    .filter(Boolean);
  if (!name || ingredients.length === 0) return null;

  const steps = flattenInstructions(node.recipeInstructions);
  const method = steps
    .map((step, index) => `${index + 1}. ${step.replace(/^\d+[.)]\s*/, "")}`)
    .join("\n");

  const timeMins =
    parseIsoDurationMins(node.totalTime) ??
    (() => {
      const prep = parseIsoDurationMins(node.prepTime) || 0;
      const cook = parseIsoDurationMins(node.cookTime) || 0;
      return prep + cook > 0 ? prep + cook : null;
    })();

  let hostname = "";
  try {
    hostname = new URL(url).hostname.replace(/^www\./, "");
  } catch {
    // no usable URL — fall through to the other source labels
  }
  const publisher = cleanText(
    (typeof node.publisher === "object" ? node.publisher?.name : node.publisher) || ""
  );
  const source = cleanText(siteName) || publisher || hostname;

  return {
    name,
    ingredients,
    method,
    serves: parseYield(node.recipeYield),
    timeMins,
    source,
    sourceUrl: url,
  };
}

// One-call convenience for the import flow: JSON-LD blocks in, recipe fields
// out (or null when the page carries no usable recipe).
export function parseImportedRecipe({ jsonLd, url = "", siteName = "" } = {}) {
  const node = findRecipeNode(jsonLd);
  return node ? normaliseImportedRecipe(node, { url, siteName }) : null;
}
