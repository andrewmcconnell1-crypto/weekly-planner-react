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

// Unicode vulgar fractions → ascii, so "½ cup" reads and matches like the
// rest of the app's ingredients ("1½" becomes "1 1/2").
const FRACTIONS = {
  "¼": "1/4", "½": "1/2", "¾": "3/4", "⅓": "1/3", "⅔": "2/3",
  "⅕": "1/5", "⅖": "2/5", "⅗": "3/5", "⅘": "4/5", "⅙": "1/6",
  "⅚": "5/6", "⅛": "1/8", "⅜": "3/8", "⅝": "5/8", "⅞": "7/8",
};

// Words that mark an after-comma segment as prep instruction rather than part
// of the item (", rinsed and drained", ", finely chopped", ", to taste") —
// noise for a shopping list. Segments without any of these are kept, so
// "chicken thighs, skin on" survives.
const PREP_WORDS = [
  "chopped", "diced", "sliced", "minced", "grated", "crushed", "peeled",
  "rinsed", "drained", "divided", "melted", "softened", "beaten", "cubed",
  "halved", "quartered", "shredded", "trimmed", "torn", "picked", "seeded",
  "deseeded", "cored", "julienned", "thinly", "finely", "roughly", "coarsely",
  "optional", "taste", "serve", "serving", "garnish", "needed", "cut into",
  "cut in", "plus more", "plus extra", "more for", "room temperature",
  "zested", "juiced", "stemmed", "sifted", "packed", "at room", "separated",
  "removed", "patted dry", "lightly",
];

// Tidy one imported ingredient line into this app's ingredient style: ascii
// fractions, no parentheticals (sizes, prices, conversions), no footnote
// marks, no prep-instruction clauses, compact tbsp/tsp units.
export function tidyIngredient(raw) {
  let text = String(raw ?? "")
    .replace(/[¼½¾⅓⅔⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞]/g, (f) => ` ${FRACTIONS[f]} `)
    .replace(/[（【]/g, "(")
    .replace(/[）】]/g, ")")
    .replace(/\*+/g, " ") // footnote markers
    .replace(/^\s*[-•]\s*/, "");

  // Drop parentheticals (sizes, prices, unit conversions) innermost-first so
  // nested ones like "(about 1/2 cup (packed))" go cleanly, then sweep any
  // orphaned brackets a site's malformed markup leaves behind.
  let before;
  do {
    before = text;
    text = text.replace(/\([^()]*\)/g, " ");
  } while (text !== before);
  text = text.replace(/\([^()]*$/, " "); // unclosed note runs to the end
  text = text.replace(/[()[\]]/g, " ");

  text = text
    .split(",")
    .filter((segment, index) => {
      if (index === 0) return true;
      const lowered = segment.toLowerCase();
      return segment.trim() && !PREP_WORDS.some((word) => lowered.includes(word));
    })
    .join(",");

  return text
    .replace(/\b(tablespoons?|tbsps?)\b\.?/gi, "tbsp")
    .replace(/\b(teaspoons?|tsps?)\b\.?/gi, "tsp")
    .replace(/\s+,/g, ",")
    .replace(/\s+/g, " ")
    .replace(/[,;\s]+$/, "")
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
    .map((entry) => tidyIngredient(cleanText(entry)))
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
