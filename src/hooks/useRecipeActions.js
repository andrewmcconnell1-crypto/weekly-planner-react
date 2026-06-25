import { useState } from "react";

import { createCollectionId } from "../utils/itemUtils";

// Saved-recipe mutators: add/delete a recipe, edit its fields, and add/remove
// ingredients. Owns the new-recipe-name text input.
export function useRecipeActions({ recipes, setRecipes, requestUndo }) {
  const [newRecipeName, setNewRecipeName] = useState("");

  function addRecipe() {
    const cleanedName = newRecipeName.trim();

    if (cleanedName === "") return;

    setRecipes([
      ...recipes,
      {
        id: createCollectionId("recipe", recipes, cleanedName),
        name: cleanedName,
        category: "Family favourites",
        source: "",
        sourceUrl: "",
        ingredients: [],
        method: "",
        serves: 4,
      },
    ]);

    setNewRecipeName("");
  }

  function deleteRecipe(id) {
    const recipe = recipes.find((item) => item.id === id);
    const snapshot = recipes;
    setRecipes(recipes.filter((item) => item.id !== id));
    requestUndo(
      recipe?.name ? `Deleted “${recipe.name}”` : "Deleted recipe",
      () => setRecipes(snapshot)
    );
    return true;
  }

  function updateRecipe(recipeId, updates) {
    setRecipes(
      recipes.map((recipe) =>
        recipe.id === recipeId ? { ...recipe, ...updates } : recipe
      )
    );
  }

  function addIngredientToRecipe(recipeId, ingredientName) {
    const cleanedIngredient = ingredientName.trim();

    if (cleanedIngredient === "") return;

    setRecipes(
      recipes.map((recipe) =>
        recipe.id === recipeId
          ? {
            ...recipe,
            ingredients: [
              ...recipe.ingredients,
              cleanedIngredient,
            ],
          }
          : recipe
      )
    );
  }

  function deleteIngredientFromRecipe(recipeId, ingredientIndex) {
    setRecipes(
      recipes.map((recipe) =>
        recipe.id === recipeId
          ? {
            ...recipe,
            ingredients: recipe.ingredients.filter(
              (_, index) => index !== ingredientIndex
            ),
          }
          : recipe
      )
    );
  }

  return {
    newRecipeName,
    setNewRecipeName,
    addRecipe,
    deleteRecipe,
    updateRecipe,
    addIngredientToRecipe,
    deleteIngredientFromRecipe,
  };
}
