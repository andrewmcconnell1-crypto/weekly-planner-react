import { getRecipeTone } from "./recipeUtils";

// Visual for a recipe with no photo: a warm gradient keyed to its category
// tone, plus a hand-drawn dish glyph (see components/DishGlyph.jsx). One
// consistent line-icon family instead of platform emoji keeps the Recipes and
// Meals screens looking designed rather than assembled.
const TONE_VISUAL = {
  chicken: { from: "#e8c98a", to: "#cf9a45", glyph: "drumstick" },
  beef: { from: "#d98a76", to: "#b0503c", glyph: "steak" },
  pork: { from: "#e3a99a", to: "#c67e6e", glyph: "steak" },
  lamb: { from: "#c290a0", to: "#9c5e72", glyph: "steak" },
  seafood: { from: "#8fbdb6", to: "#5f8e88", glyph: "fish" },
  vegetarian: { from: "#a7bd7f", to: "#5f6a3a", glyph: "leaf" },
  pasta: { from: "#e6c66f", to: "#c79a2f", glyph: "pastaFork" },
  rice: { from: "#e3cd8c", to: "#d2b15c", glyph: "rice" },
  slow: { from: "#bd9a78", to: "#946c46", glyph: "pot" },
  mexican: { from: "#e0855c", to: "#c4582f", glyph: "taco" },
  noodles: { from: "#d6a373", to: "#b97a44", glyph: "noodles" },
  kid: { from: "#e5a08c", to: "#cf7a63", glyph: "burger" },
  family: { from: "#c290a0", to: "#9c5e72", glyph: "plate" },
  other: { from: "#c4b39d", to: "#a89683", glyph: "plate" },
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

// Resolve a recipe to its display tile: a warm gradient keyed to the category
// tone plus a dish glyph read from the name. Deliberately illustrative (no
// photos) so the Recipes and Meals screens look lively with no external images.
export function recipeImagery(recipe) {
  const tone = getRecipeTone(recipe?.category);
  const visual = TONE_VISUAL[tone] || TONE_VISUAL.other;

  return {
    tone,
    gradient: `linear-gradient(135deg, ${visual.from}, ${visual.to})`,
    glyph: dishGlyph(recipe?.name, visual.glyph),
  };
}
