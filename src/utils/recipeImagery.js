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

// A stable seed from the name so a recipe's generated image stays the same
// across loads (and is cached) instead of regenerating differently each time.
function stableSeed(text) {
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
  }
  return hash % 100000;
}

// Keyless AI food photo for a recipe, built from its name. Pollinations
// generates an image straight from the prompt in the URL — no API key, usable
// directly as an <img src>. Seeded so it's stable and cacheable.
export function aiImageUrl(name) {
  const clean = String(name || "").trim();
  if (!clean) return "";

  const prompt =
    `appetising professional food photography of ${clean}, ` +
    `plated, natural light, shallow depth of field, no text`;
  const seed = stableSeed(clean);

  return (
    "https://image.pollinations.ai/prompt/" +
    `${encodeURIComponent(prompt)}?width=512&height=384&seed=${seed}` +
    "&nologo=true&model=flux"
  );
}

// Resolve a recipe to its display imagery. The gradient + emoji placeholder is
// always computed as the loading/fallback layer. `type` is "photo" when the
// recipe has its own image, else "ai" when a generated image can be built from
// the name, else "placeholder".
export function recipeImagery(recipe) {
  const url = (recipe?.image || "").trim();
  const tone = getRecipeTone(recipe?.category);
  const visual = TONE_VISUAL[tone] || TONE_VISUAL.other;
  const aiUrl = aiImageUrl(recipe?.name);

  return {
    type: url ? "photo" : aiUrl ? "ai" : "placeholder",
    url,
    aiUrl,
    tone,
    gradient: `linear-gradient(135deg, ${visual.from}, ${visual.to})`,
    emoji: dishEmoji(recipe?.name, visual.emoji),
  };
}
