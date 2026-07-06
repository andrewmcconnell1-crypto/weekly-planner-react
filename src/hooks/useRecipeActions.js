import { useState } from "react";

import { createCollectionId } from "../utils/itemUtils";
import { deriveMainCategory, deriveRecipeTags } from "../utils/recipeUtils";

// Saved-recipe mutators: add/delete a recipe, edit its fields, and add/remove
// ingredients. Owns the new-recipe-name text input.
export function useRecipeActions({
  recipes,
  setRecipes,
  requestUndo,
  defaultServings = 4,
}) {
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
        serves: defaultServings,
      },
    ]);

    setNewRecipeName("");
  }

  // Save a recipe parsed from a web page (see utils/recipeImport). Category
  // and tags are derived the same way the bundled recipes get theirs. Returns
  // the new id so the caller can open it in the editor for review.
  function addImportedRecipe(parsed) {
    const id = createCollectionId("recipe", recipes, parsed.name);

    setRecipes([
      ...recipes,
      {
        id,
        name: parsed.name,
        category: deriveMainCategory(parsed),
        source: parsed.source || "",
        sourceUrl: parsed.sourceUrl || "",
        ingredients: parsed.ingredients,
        method: parsed.method || "",
        serves: parsed.serves ?? defaultServings,
        tags: deriveRecipeTags(parsed),
        timeMins: parsed.timeMins ?? null,
      },
    ]);

    return id;
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
    addImportedRecipe,
    deleteRecipe,
    updateRecipe,
    addIngredientToRecipe,
    deleteIngredientFromRecipe,
  };
}
