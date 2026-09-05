import { getRecipeTone } from "./recipeUtils";

// Visual for a recipe with no photo: a cool, muted gradient keyed to its
// category tone, plus a hand-drawn dish glyph (see components/DishGlyph.jsx).
// One consistent line-icon family instead of platform emoji keeps the Recipes
// and Meals screens looking designed rather than assembled. The palette is a
// desaturated cool/slate spectrum so tiles stay distinguishable by category
// while reading clean and clinical rather than warm.
const TONE_VISUAL = {
  chicken: { from: "#aec4dc", to: "#6f8fae", glyph: "drumstick" },
  beef: { from: "#b3b3c6", to: "#7d7f97", glyph: "steak" },
  pork: { from: "#c2cdd2", to: "#8fa0a6", glyph: "steak" },
  lamb: { from: "#b6a6bd", to: "#86798f", glyph: "steak" },
  seafood: { from: "#9fc4bf", to: "#5f8e88", glyph: "fish" },
  vegetarian: { from: "#a9c9b6", to: "#6f9e86", glyph: "leaf" },
  pasta: { from: "#b7c3cd", to: "#7f93a0", glyph: "pastaFork" },
  rice: { from: "#c3ccd6", to: "#9aa7b3", glyph: "rice" },
  slow: { from: "#a6b4bf", to: "#6b7d8c", glyph: "pot" },
  mexican: { from: "#b3bccd", to: "#7e8aa0", glyph: "taco" },
  noodles: { from: "#a7c3cb", to: "#6f97a0", glyph: "noodles" },
  kid: { from: "#aec2dc", to: "#7c93b4", glyph: "burger" },
  family: { from: "#b6a6bd", to: "#86798f", glyph: "plate" },
  other: { from: "#bcc4ce", to: "#8b95a1", glyph: "plate" },
};

// A more specific glyph when the dish name gives one away (checked in order).
// Falls back to the tone glyph otherwise.
const NAME_GLYPH = [
  [["pizza"], "pizza"],
  [["taco", "burrito", "fajita", "quesadilla", "nacho", "enchilada"], "taco"],
  [["burger"], "burger"],
  [["salad", "slaw"], "leaf"],
  [["soup", "broth", "chowder", "bisque", "minestrone"], "bowlSteam"],
  [["curry", "dal", "dahl", "tikka", "korma", "biryani"], "pot"],
  [["ramen", "noodle", "laksa", "pad thai", "udon", "pho"], "noodles"],
  [["risotto", "fried rice", "rice", "pilaf", "jambalaya"], "rice"],
  [["pasta", "spaghetti", "lasagne", "lasagna", "carbonara", "bolognese", "gnocchi", "linguine", "tagliatelle", "orzo", "penne", "rigatoni", "pappardelle", "risoni", "macaroni"], "pastaFork"],
  [["sushi", "poke"], "fish"],
  [["sandwich", "toastie", "wrap", "sub", "panini", "kofta", "shawarma", "souvlaki", "banh mi"], "wrap"],
  [["omelette", "omelet", "shakshuka", "frittata", "scramble", "egg"], "eggPan"],
  [["pie", "pasty"], "pie"],
  [["dumpling", "gyoza", "wonton", "potsticker"], "bowlSteam"],
  [["pancake", "hotcake"], "eggPan"],
  [["stew", "casserole", "braise", "hotpot", "tagine", "cassoulet"], "pot"],
  [["roast", "schnitzel", "wings", "nugget", "drumstick"], "drumstick"],
  [["steak", "brisket"], "steak"],
  [["salmon", "fish", "prawn", "shrimp", "tuna", "scallop", "barramundi", "cod"], "fish"],
];

function dishGlyph(name, toneGlyph) {
  const text = String(name || "").toLowerCase();
  for (const [hints, glyph] of NAME_GLYPH) {
    if (hints.some((hint) => text.includes(hint))) return glyph;
  }
  return toneGlyph;
}

// Small stable hash of a string, so the same recipe always gets the same look.
function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i += 1) {
    hash = (hash * 31 + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

// Resolve a recipe to its display tile: a warm gradient keyed to the category
// tone plus a dish glyph read from the name. Deliberately illustrative (no
// photos) so the Recipes and Meals screens look lively with no external images.
// The gradient angle varies per recipe (a stable hash) so a run of same-category
// tiles doesn't read as one flat block.
export function recipeImagery(recipe) {
  const tone = getRecipeTone(recipe?.category);
  const visual = TONE_VISUAL[tone] || TONE_VISUAL.other;
  const seed = hashString(recipe?.id || recipe?.name || "");
  const angle = 110 + (seed % 6) * 12; // 110–170° in 12° steps

  return {
    tone,
    seed,
    gradient: `linear-gradient(${angle}deg, ${visual.from}, ${visual.to})`,
    glyph: dishGlyph(recipe?.name, visual.glyph),
  };
}
