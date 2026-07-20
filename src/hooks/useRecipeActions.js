import { useState } from "react";

import { createCollectionId } from "../utils/itemUtils";
import { deriveMainCategory, deriveRecipeTags } from "../utils/recipeUtils";
import { initialRecipes } from "../data/initialRecipes";

// Ids of the bundled built-in recipes. Deleting one of these has to be recorded
// in a tombstone list, otherwise the bundle re-appends it on the next load.
const builtInRecipeIds = new Set(initialRecipes.map((recipe) => recipe.id));

// Saved-recipe mutators: add/delete a recipe, edit its fields, and add/remove
// ingredients. Owns the new-recipe-name text input.
export function useRecipeActions({
  recipes,
  setRecipes,
  setDeletedRecipeIds,
  requestUndo,
  defaultServings = 4,
}) {
  const [newRecipeName, setNewRecipeName] = useState("");

  // Keep a built-in id out of / back into the tombstone list. No-op for
  // user-created recipes (they're never re-added from the bundle).
  function tombstoneBuiltIn(id) {
    if (!builtInRecipeIds.has(id) || !setDeletedRecipeIds) return;
    setDeletedRecipeIds((ids = []) => (ids.includes(id) ? ids : [...ids, id]));
  }

  function untombstoneBuiltIn(id) {
    if (!builtInRecipeIds.has(id) || !setDeletedRecipeIds) return;
    setDeletedRecipeIds((ids = []) => ids.filter((tombstoned) => tombstoned !== id));
  }

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
        addedOn: new Date().toISOString(),
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
        addedOn: new Date().toISOString(),
      },
    ]);

    return id;
  }

  function deleteRecipe(id) {
    const recipe = recipes.find((item) => item.id === id);
    const snapshot = recipes;
    setRecipes(recipes.filter((item) => item.id !== id));
    // Record built-in deletions so they don't resurrect from the bundle.
    tombstoneBuiltIn(id);
    requestUndo(
      recipe?.name ? `Deleted “${recipe.name}”` : "Deleted recipe",
      () => {
        setRecipes(snapshot);
        untombstoneBuiltIn(id);
      }
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
