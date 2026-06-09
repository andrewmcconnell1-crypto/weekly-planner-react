import { normaliseItemName } from "./itemUtils";

const categoryOrder = [
  "Chicken",
  "Beef",
  "Pasta",
  "Rice",
  "Slow cooker",
  "Mexican",
  "Noodles",
  "Vegetarian",
  "Kid-friendly",
  "Family favourites",
  "Other",
];

// The known recipe categories, used to populate category pickers.
export const recipeCategories = categoryOrder;

export function getRecipeCategory(recipe) {
  return recipe.category || "Other";
}

export function getRecipeTone(category) {
  const normalisedCategory = normaliseItemName(category || "");

  if (normalisedCategory.includes("chicken")) return "chicken";
  if (normalisedCategory.includes("beef")) return "beef";
  if (normalisedCategory.includes("pasta")) return "pasta";
  if (normalisedCategory.includes("rice")) return "rice";
  if (normalisedCategory.includes("slow")) return "slow";
  if (normalisedCategory.includes("mexican")) return "mexican";
  if (normalisedCategory.includes("noodle")) return "noodles";
  if (normalisedCategory.includes("vegetarian")) return "vegetarian";
  if (normalisedCategory.includes("kid")) return "kid";
  if (normalisedCategory.includes("family")) return "family";

  return "other";
}

export function groupRecipesByCategory(recipes) {
  const groupsByCategory = recipes.reduce((groups, recipe) => {
    const category = getRecipeCategory(recipe);

    if (!groups[category]) {
      groups[category] = [];
    }

    groups[category].push(recipe);
    return groups;
  }, {});

  return Object.entries(groupsByCategory)
    .map(([category, groupedRecipes]) => ({
      category,
      tone: getRecipeTone(category),
      recipes: [...groupedRecipes].sort((a, b) =>
        a.name.localeCompare(b.name)
      ),
    }))
    .sort((a, b) => {
      const aIndex = categoryOrder.indexOf(a.category);
      const bIndex = categoryOrder.indexOf(b.category);

      if (aIndex !== -1 || bIndex !== -1) {
        if (aIndex === -1) return 1;
        if (bIndex === -1) return -1;
        return aIndex - bIndex;
      }

      return a.category.localeCompare(b.category);
    });
}
