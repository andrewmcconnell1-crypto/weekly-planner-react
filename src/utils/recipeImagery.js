import { getRecipeTone } from "./recipeUtils";

// Visual for a recipe with no photo: a warm gradient keyed to its category
// tone, plus a dish emoji. Keeps the Recipes and Meals screens looking rich
// even before anyone adds a single photo.
const TONE_VISUAL = {
  chicken: { from: "#e8c98a", to: "#cf9a45", emoji: "🍗" },
  beef: { from: "#d98a76", to: "#b0503c", emoji: "🥩" },
  pork: { from: "#e3a99a", to: "#c67e6e", emoji: "🥓" },
  lamb: { from: "#c290a0", to: "#9c5e72", emoji: "🍖" },
  seafood: { from: "#8fbdb6", to: "#5f8e88", emoji: "🐟" },
  vegetarian: { from: "#a7bd7f", to: "#5f6a3a", emoji: "🥗" },
  pasta: { from: "#e6c66f", to: "#c79a2f", emoji: "🍝" },
  rice: { from: "#e3cd8c", to: "#d2b15c", emoji: "🍚" },
  slow: { from: "#bd9a78", to: "#946c46", emoji: "🍲" },
  mexican: { from: "#e0855c", to: "#c4582f", emoji: "🌮" },
  noodles: { from: "#d6a373", to: "#b97a44", emoji: "🍜" },
  kid: { from: "#e5a08c", to: "#cf7a63", emoji: "🧀" },
  family: { from: "#c290a0", to: "#9c5e72", emoji: "🍽️" },
  other: { from: "#c4b39d", to: "#a89683", emoji: "🍽️" },
};

// A more specific emoji when the dish name gives one away (checked in order).
// Falls back to the tone emoji otherwise.
const NAME_EMOJI = [
  [["pizza"], "🍕"],
  [["taco", "burrito", "fajita", "quesadilla", "nacho", "enchilada"], "🌮"],
  [["burger"], "🍔"],
  [["salad", "slaw"], "🥗"],
  [["soup", "broth", "chowder", "bisque", "minestrone"], "🥣"],
  [["curry", "dal", "dahl", "tikka", "korma", "biryani"], "🍛"],
  [["ramen", "noodle", "laksa", "pad thai", "udon", "pho"], "🍜"],
  [["pasta", "spaghetti", "lasagne", "lasagna", "carbonara", "bolognese", "gnocchi", "risotto"], "🍝"],
  [["sushi", "poke"], "🍣"],
  [["sandwich", "toastie", "wrap", "sub", "panini"], "🥪"],
  [["fried rice", "rice", "pilaf", "jambalaya"], "🍚"],
  [["omelette", "omelet", "shakshuka", "frittata", "scramble", "egg"], "🍳"],
  [["pie", "pasty"], "🥧"],
  [["dumpling", "gyoza", "wonton", "potsticker"], "🥟"],
  [["pancake", "hotcake"], "🥞"],
  [["stew", "casserole", "braise", "hotpot", "tagine"], "🍲"],
  [["roast", "schnitzel", "wings", "nugget"], "🍗"],
  [["steak", "brisket"], "🥩"],
  [["salmon", "fish", "prawn", "shrimp", "tuna"], "🐟"],
];

function dishEmoji(name, toneEmoji) {
  const text = String(name || "").toLowerCase();
  for (const [hints, emoji] of NAME_EMOJI) {
    if (hints.some((hint) => text.includes(hint))) return emoji;
  }
  return toneEmoji;
}

// Resolve a recipe to its display imagery. The gradient + emoji placeholder is
// always computed (so a broken photo URL can fall back to it); `type` is
// "photo" when the recipe has an image set, otherwise "placeholder".
export function recipeImagery(recipe) {
  const url = (recipe?.image || "").trim();
  const tone = getRecipeTone(recipe?.category);
  const visual = TONE_VISUAL[tone] || TONE_VISUAL.other;

  return {
    type: url ? "photo" : "placeholder",
    url,
    tone,
    gradient: `linear-gradient(135deg, ${visual.from}, ${visual.to})`,
    emoji: dishEmoji(recipe?.name, visual.emoji),
  };
}
