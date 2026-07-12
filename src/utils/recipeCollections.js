import { QUICK_MAX_MINS } from "./recipeUtils";

const hasTag = (recipe, tag) => (recipe.tags || []).includes(tag);

// Curated, evergreen browse rows for the Recipes "For you" feed. Each matcher
// leans on data every recipe already carries (derived tags, category, time), so
// the rows fill themselves and stay correct as the library grows. Order here is
// the order they appear.
export const RECIPE_COLLECTIONS = [
  {
    key: "quick",
    title: "Quick weeknights",
    subtitle: "On the table in half an hour.",
    match: (recipe) =>
      hasTag(recipe, "Quick") ||
      (recipe.timeMins && recipe.timeMins <= QUICK_MAX_MINS),
  },
  {
    key: "family",
    title: "Crowd-pleasers",
    subtitle: "Kid-friendly favourites.",
    match: (recipe) => hasTag(recipe, "Kid-friendly"),
  },
  {
    key: "veg",
    title: "Veg-forward",
    subtitle: "Meat-free mains.",
    match: (recipe) =>
      recipe.category === "Vegetarian" || hasTag(recipe, "Vegetarian"),
  },
  {
    key: "slow",
    title: "Low & slow",
    subtitle: "Set it and let it go.",
    match: (recipe) => hasTag(recipe, "Slow-cooked"),
  },
];

// The recipes in a collection, capped so a row stays a browsable strip.
export function collectionRecipes(recipes, collection, limit = 14) {
  const out = [];
  for (const recipe of recipes) {
    if (collection.match(recipe)) {
      out.push(recipe);
      if (out.length >= limit) break;
    }
  }
  return out;
}
