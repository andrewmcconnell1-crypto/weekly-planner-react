// Matching so a recipe ingredient already covered by stock or a recurring buy
// isn't re-added to the shopping list.
//
// Recipe ingredients ("2 cups basmati rice", "1 onion, finely chopped") and
// pantry/recurring names ("Rice", "Onion Brown", "Woolworths ... Rice 450g")
// almost never match character-for-character. So we reduce each side to its
// core food words — dropping quantities, units, prep notes, brand/size and
// common qualifiers — and canonicalise a few regional synonyms, then treat two
// names as a match only when those core-word sets are *equal*.
//
// This is deliberately strict (equal sets, not subset): a generic "milk" must
// NOT be considered covered by "coconut milk", and "rice" is not "basmati
// rice". The trade-off is that a genuine generic↔specific pair only matches
// when the difference is a stripped qualifier ("brown onion" == "onion",
// "extra virgin olive oil" == "olive oil") or a listed synonym — a true variety
// word (coconut, basmati) keeps them apart, which is the intended behaviour.

const UNIT_WORDS = new Set([
  "cup", "cups", "tablespoon", "tablespoons", "tbsp", "tbs", "teaspoon",
  "teaspoons", "tsp", "g", "gram", "grams", "gm", "kg", "mg", "ml", "l",
  "litre", "litres", "liter", "liters", "oz", "ounce", "ounces", "lb", "lbs",
  "pound", "pounds", "clove", "cloves", "can", "cans", "tin", "tins", "jar",
  "jars", "packet", "packets", "pack", "packs", "slice", "slices", "pinch",
  "pinches", "dash", "handful", "handfuls", "bunch", "bunches", "sprig",
  "sprigs", "stick", "sticks", "knob", "piece", "pieces", "fillet", "fillets",
  "rasher", "rashers", "sheet", "sheets", "cube", "cubes", "head", "heads",
  "bottle", "bottles", "carton", "cartons", "loaf", "loaves", "bag", "bags",
  "box", "boxes", "punnet", "punnets", "each", "tub", "tubs", "drizzle",
  "splash", "glass",
]);

const QUALIFIER_WORDS = new Set([
  "fresh", "dried", "ground", "whole", "large", "small", "medium", "baby",
  "ripe", "free", "range", "finely", "roughly", "coarsely", "chopped", "diced",
  "sliced", "minced", "grated", "crushed", "peeled", "cooked", "raw", "frozen",
  "organic", "lean", "extra", "virgin", "light", "lite", "low", "gi", "plain",
  "self", "raising", "pure", "fine", "coarse", "hot", "cold", "warm",
  "boneless", "skinless", "optional", "taste", "serve", "serving", "approx",
  "about", "red", "green", "brown", "white", "yellow", "black", "golden",
  "wild", "long", "grain", "short", "australian", "grown", "homogenised",
  "full", "cream", "reduced", "fat", "skim", "thinly", "good", "quality",
  "unsalted", "salted", "caster", "icing", "soft", "firm", "mixed", "assorted",
]);

const FILLER_WORDS = new Set([
  "of", "to", "for", "and", "or", "the", "a", "an", "with", "into", "plus",
  "in", "on", "your", "my", "some", "few",
]);

const BRAND_WORDS = new Set([
  "woolworths", "coles", "aldi", "homebrand", "essentials", "macro", "heinz",
  "masterfoods", "yoplait", "farmers", "own", "sunny", "queen", "burgen",
  "carmans", "carman",
]);

// Regional / common synonyms, collapsed to one canonical phrase so equivalent
// names share core tokens. Applied as whole-word phrase replacements (with an
// optional trailing "s") before tokenising, so multi-word variants work. Easy
// to extend — order doesn't matter as the canonical forms don't overlap.
const SYNONYM_RULES = [
  ["cilantro", "coriander"],
  ["scallion", "spring onion"],
  ["green onion", "spring onion"],
  ["spring onions", "spring onion"],
  ["garbanzo bean", "chickpea"],
  ["garbanzo", "chickpea"],
  ["aubergine", "eggplant"],
  ["courgette", "zucchini"],
  ["arugula", "rocket"],
  ["shrimp", "prawn"],
  ["mangetout", "snow pea"],
  ["bell pepper", "capsicum"],
  ["all purpose flour", "plain flour"],
  ["all-purpose flour", "plain flour"],
  ["powdered sugar", "icing sugar"],
  ["confectioners sugar", "icing sugar"],
  ["confectioner sugar", "icing sugar"],
  ["baking soda", "bicarbonate soda"],
  ["bicarbonate of soda", "bicarbonate soda"],
  ["ground beef", "beef mince"],
  ["minced beef", "beef mince"],
].map(([from, to]) => [
  new RegExp(`\\b${from.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")}s?\\b`, "g"),
  to,
]);

function applySynonyms(text) {
  let result = text;
  for (const [pattern, canonical] of SYNONYM_RULES) {
    result = result.replace(pattern, canonical);
  }
  return result;
}

function singularize(word) {
  if (word.length <= 3) return word;
  if (word.endsWith("ies")) return `${word.slice(0, -3)}y`;
  if (word.endsWith("oes")) return word.slice(0, -2);
  if (word.endsWith("ss")) return word;
  if (word.endsWith("s")) return word.slice(0, -1);
  return word;
}

// Reduce a name to its set of meaningful, singularised food words.
export function extractCoreTokens(rawName) {
  let text = String(rawName || "").toLowerCase();
  text = text.replace(/\([^)]*\)/g, " "); // drop parentheticals
  text = text.split(",")[0]; // drop prep notes after the first comma
  text = text.replace(/[^a-z0-9\s]/g, " "); // strip punctuation incl. fractions
  text = text.replace(/\s+/g, " ").trim();
  text = applySynonyms(text);

  const tokens = new Set();

  for (const rawToken of text.split(/\s+/)) {
    if (!rawToken) continue;
    if (/^[0-9]/.test(rawToken)) continue; // numbers + sizes like 450g, 2l
    if (UNIT_WORDS.has(rawToken)) continue;
    if (QUALIFIER_WORDS.has(rawToken)) continue;
    if (FILLER_WORDS.has(rawToken)) continue;
    if (BRAND_WORDS.has(rawToken)) continue;

    const token = singularize(rawToken);
    if (token.length < 2) continue;

    tokens.add(token);
  }

  return tokens;
}

// A match only when the two core-word sets are identical — so "coconut milk"
// never covers "milk", but "brown onion" still covers "onion" (the difference
// is a stripped qualifier).
function tokensEqual(a, b) {
  if (a.size === 0 || b.size === 0) return false;
  if (a.size !== b.size) return false;

  for (const token of a) {
    if (!b.has(token)) return false;
  }

  return true;
}

// Pre-compute the core token sets for the things you already have, once. Keeps
// the original name so we can tell the user what covered an ingredient.
export function buildCoverageIndex(names) {
  return names
    .map((name) => ({ name, tokens: extractCoreTokens(name) }))
    .filter((entry) => entry.tokens.size > 0);
}

// Returns the name of the stock / recurring item covering this ingredient, or
// null if nothing covers it.
export function findCoverage(ingredientName, coverageIndex) {
  const ingredientTokens = extractCoreTokens(ingredientName);
  if (ingredientTokens.size === 0) return null;

  const match = coverageIndex.find((entry) =>
    tokensEqual(ingredientTokens, entry.tokens)
  );

  return match ? match.name : null;
}

export function isIngredientCovered(ingredientName, coverageIndex) {
  return findCoverage(ingredientName, coverageIndex) !== null;
}
