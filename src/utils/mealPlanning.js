import { normaliseItemName } from "./itemUtils";
import { getRecipeTone } from "./recipeUtils";

export const emptyMeal = {
  name: "",
  recipeId: "",
  mealType: "cook",
  repeatFromDay: "",
  ingredients: [],
  batches: 1,
};

// Builds a set of meal-summary helpers bound to the current recipe list.
// Everything here is pure (depends only on the arguments + `recipes`), which
// keeps the logic out of the App component and makes it unit-testable.
export function createMealHelpers(recipes) {
  function getMealType(meal) {
    if (!meal) return "cook";
    if (meal.mealType) return meal.mealType;
    return "cook";
  }

  function getRecipeForMeal(meal) {
    if (!meal) return null;
    if (getMealType(meal) !== "cook") return null;

    if (meal.recipeId) {
      const linkedRecipe = recipes.find((recipe) => recipe.id === meal.recipeId);

      if (linkedRecipe) return linkedRecipe;
    }

    const normalisedMealName = normaliseItemName(meal.name || "");

    if (!normalisedMealName) return null;

    return (
      recipes.find(
        (recipe) => normaliseItemName(recipe.name) === normalisedMealName
      ) || null
    );
  }

  function getIngredientsForMeal(meal) {
    if (getMealType(meal) !== "cook") return [];

    const linkedRecipe = getRecipeForMeal(meal);
    const recipeIngredients = linkedRecipe?.ingredients || [];
    const mealIngredients = Array.isArray(meal?.ingredients)
      ? meal.ingredients
      : [];
    const seenIngredients = new Set();

    return [...recipeIngredients, ...mealIngredients].filter((ingredient) => {
      const cleanedIngredient = String(ingredient).trim();

      if (!cleanedIngredient) return false;

      const normalisedIngredient = normaliseItemName(cleanedIngredient);

      if (seenIngredients.has(normalisedIngredient)) {
        return false;
      }

      seenIngredients.add(normalisedIngredient);
      return true;
    });
  }

  function getMealDisplayName(meal, linkedRecipe, weekMeals) {
    const mealType = getMealType(meal);

    if (mealType === "takeaway") return "Takeaway";
    if (mealType === "eating-out") return "Eating out";

    if (mealType === "repeat") {
      const repeatFromDay = meal?.repeatFromDay;
      const sourceMeal = repeatFromDay ? weekMeals[repeatFromDay] : null;
      const sourceMealType = getMealType(sourceMeal);
      const sourceRecipe = getRecipeForMeal(sourceMeal);
      const sourceName =
        sourceMeal && sourceMealType !== "repeat"
          ? getMealDisplayName(sourceMeal, sourceRecipe, weekMeals)
          : "";

      // Lead with the dish you'll actually eat; the "Leftovers from X" framing
      // lives in the label so the card reads like a meal, not a pointer.
      if (sourceName && sourceName !== "No meal planned") {
        return sourceName;
      }

      return "Leftovers";
    }

    return linkedRecipe?.name || (meal?.name || "").trim() || "No meal planned";
  }

  function getMealLabel(meal, linkedRecipe) {
    const mealType = getMealType(meal);
    const hasCustomMeal =
      (meal?.name || "").trim() !== "" || Boolean(meal?.ingredients?.length);

    if (mealType === "takeaway") return "No shopping needed";
    if (mealType === "eating-out") return "No shopping needed";
    if (mealType === "repeat") {
      return meal?.repeatFromDay
        ? `Leftovers from ${meal.repeatFromDay}`
        : "Leftovers";
    }
    if (linkedRecipe) return linkedRecipe.category || "Recipe";
    return hasCustomMeal ? "Custom meal" : "Unplanned";
  }

  function getMealTone(meal, linkedRecipe, hasMeal) {
    const mealType = getMealType(meal);

    if (!hasMeal) return "empty";
    if (mealType === "repeat") return "repeat";
    if (mealType === "takeaway") return "takeaway";
    if (mealType === "eating-out") return "out";
    if (linkedRecipe) return getRecipeTone(linkedRecipe.category);

    return "custom";
  }

  function mealHasPlan(meal) {
    const mealType = getMealType(meal);

    if (mealType === "takeaway" || mealType === "eating-out") return true;
    if (mealType === "repeat") return Boolean(meal?.repeatFromDay);

    return (
      (meal?.name || "").trim() !== "" ||
      getIngredientsForMeal(meal).length > 0
    );
  }

  function getMealSummary(day, meal, weekMeals) {
    const normalisedMeal = meal || emptyMeal;
    const linkedRecipe = getRecipeForMeal(normalisedMeal);
    const ingredients = getIngredientsForMeal(normalisedMeal);
    const hasMeal = mealHasPlan(normalisedMeal);

    return {
      day,
      meal: normalisedMeal,
      linkedRecipe,
      ingredients,
      hasMeal,
      name: getMealDisplayName(normalisedMeal, linkedRecipe, weekMeals),
      label: getMealLabel(normalisedMeal, linkedRecipe),
      tone: getMealTone(normalisedMeal, linkedRecipe, hasMeal),
    };
  }

  return {
    getMealType,
    getRecipeForMeal,
    getIngredientsForMeal,
    getMealDisplayName,
    getMealLabel,
    getMealTone,
    mealHasPlan,
    getMealSummary,
  };
}
