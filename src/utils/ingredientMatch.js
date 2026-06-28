import { INGREDIENT_GROUPS } from "../data/ingredientGroups";

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
// NOT be considered covered by "coconut milk". Where the difference is only a
// stripped qualifier ("brown onion" == "onion", "extra virgin olive oil" ==
// "olive oil") or a listed synonym, the two still match.
//
// Genuine generic↔specific pairs (recipe wants "rice", you stock "basmati
// rice") are reconnected through a seed catalog of groups (data/ingredientGroups):
// a specific rolls up to an overarching item, so the generic covers any variety
// and a variety covers the generic — but two different varieties in the same
// group never cover each other. A true cross-food pair (coconut milk vs milk)
// is simply never grouped, so it stays apart.

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
  "shredded",
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
  ["broth", "stock"],
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

// A name's canonical key: its core food words, singularised and sorted, joined
// by a space ("" when there are no food words). Two names with the same key are
// the same item; this is the exact-match unit everything else builds on.
export function canonicalKey(name) {
  return [...extractCoreTokens(name)].sort().join(" ");
}

// Seed catalog, keyed by canonical key (so "Basmati Rice" and "basmati rice"
// resolve the same). GROUP_BY_KEY holds the canonical group key used for
// matching; GROUP_LABEL_BY_KEY keeps the readable group name for the editor.
const { GROUP_BY_KEY, GROUP_LABEL_BY_KEY } = (() => {
  const byKey = new Map();
  const labelByKey = new Map();
  for (const [specific, group] of Object.entries(INGREDIENT_GROUPS)) {
    const specificKey = canonicalKey(specific);
    const groupKey = canonicalKey(group);
    if (specificKey && groupKey) {
      byKey.set(specificKey, groupKey);
      labelByKey.set(specificKey, group);
    }
  }
  return { GROUP_BY_KEY: byKey, GROUP_LABEL_BY_KEY: labelByKey };
})();

// Resolve a name to its identity for matching: its own key, the group it rolls
// up to (itself when ungrouped), and whether it *is* that group (the generic).
// `overrides` is the user's per-household group map (canonicalKey -> name); it
// wins over the seed catalog, so people can fix or add groupings themselves.
export function resolveIngredient(name, overrides = {}) {
  const key = canonicalKey(name);
  if (!key) return null;

  const override = overrides[key];
  const group = override
    ? canonicalKey(override) || key
    : GROUP_BY_KEY.get(key) || key;

  return { key, group, isGeneric: key === group };
}

// Does a stock/recurring item cover a wanted ingredient? Covered when they are
// the same item, or when one is the other's group — but never two different
// specifics in the same group (basmati never covers sushi; coconut milk never
// covers milk, since they aren't grouped together at all).
function entryCovers(have, want) {
  if (have.key === want.key) return true;
  // A generic you stock ("rice") covers a specific the recipe wants ("basmati").
  if (have.isGeneric && have.key === want.group) return true;
  // A specific you stock ("basmati") covers the generic the recipe wants ("rice").
  if (want.isGeneric && want.key === have.group) return true;
  return false;
}

// Pre-compute the resolved identity for the things you already have, once.
// Keeps the original name so we can tell the user what covered an ingredient.
export function buildCoverageIndex(names, overrides = {}) {
  return names
    .map((name) => ({ name, ...resolveIngredient(name, overrides) }))
    .filter((entry) => entry.key);
}

// Returns the name of the stock / recurring item covering this ingredient, or
// null if nothing covers it.
export function findCoverage(ingredientName, coverageIndex, overrides = {}) {
  const want = resolveIngredient(ingredientName, overrides);
  if (!want) return null;

  const match = coverageIndex.find((entry) => entryCovers(entry, want));
  return match ? match.name : null;
}

export function isIngredientCovered(ingredientName, coverageIndex, overrides) {
  return findCoverage(ingredientName, coverageIndex, overrides) !== null;
}

// The readable group label for a name, for the group editor: the user's
// override if set, else the seed group, else "" when the item is ungrouped
// (its own group). Note resolveIngredient returns the canonical group *key*
// (sorted tokens) for matching; this returns the human spelling.
export function groupLabelFor(name, overrides = {}) {
  const key = canonicalKey(name);
  if (!key) return "";
  if (overrides[key]) return overrides[key];
  return GROUP_LABEL_BY_KEY.get(key) || "";
}

// Distinct overarching group names the app knows about — the seed groups plus
// any the user has assigned — to suggest in the group editor. Deduped
// case-insensitively, keeping the first spelling seen.
export function listKnownGroups(overrides = {}) {
  const byKey = new Map();
  const add = (value) => {
    const trimmed = (value || "").trim();
    if (trimmed && !byKey.has(trimmed.toLowerCase())) {
      byKey.set(trimmed.toLowerCase(), trimmed);
    }
  };

  Object.values(INGREDIENT_GROUPS).forEach(add);
  Object.values(overrides).forEach(add);

  return [...byKey.values()].sort((a, b) => a.localeCompare(b));
}
