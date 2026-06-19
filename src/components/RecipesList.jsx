import { useState } from "react";
import { Plus, Search } from "lucide-react";

import { groupRecipesByCategory, recipeSourceLabel } from "../utils/recipeUtils";
import RecipeCard from "./RecipeCard";
import RecipeEditorSheet from "./RecipeEditorSheet";
import RecipeFilter from "./RecipeFilter";

const SOURCE_ORDER = ["RecipeTin Eats", "Original recipes", "Custom"];

function RecipesList({
  recipes,
  newRecipeName,
  setNewRecipeName,
  addRecipe,
  deleteRecipe,
  addIngredientToRecipe,
  deleteIngredientFromRecipe,
  updateRecipe,
}) {
  const [searchText, setSearchText] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeSource, setActiveSource] = useState("All");
  const [openRecipeId, setOpenRecipeId] = useState(null);
  // Adding a recipe is a rare action, so it stays tucked behind a quiet toggle.
  const [showAddRecipe, setShowAddRecipe] = useState(false);

  // Grouped only to get a sensible category order + name sort; we render flat.
  const recipeGroups = groupRecipesByCategory(recipes);
  const categories = ["All", ...recipeGroups.map((group) => group.category)];
  const allRecipes = recipeGroups.flatMap((group) => group.recipes);

  const distinctSources = [
    ...new Set(recipes.map(recipeSourceLabel)),
  ].sort((a, b) => {
    const aIndex = SOURCE_ORDER.indexOf(a);
    const bIndex = SOURCE_ORDER.indexOf(b);

    if (aIndex === -1 && bIndex === -1) return a.localeCompare(b);
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    return aIndex - bIndex;
  });
  const sources = ["All", ...distinctSources];

  const cleanedSearch = searchText.trim().toLowerCase();
  const categoryIsAvailable =
    activeCategory === "All" || categories.includes(activeCategory);
  const sourceIsAvailable =
    activeSource === "All" || sources.includes(activeSource);
  const visibleRecipes = allRecipes.filter((recipe) => {
    const inCategory =
      !categoryIsAvailable ||
      activeCategory === "All" ||
      (recipe.category || "Other") === activeCategory;
    const inSource =
      !sourceIsAvailable ||
      activeSource === "All" ||
      recipeSourceLabel(recipe) === activeSource;

    if (!inCategory || !inSource) return false;
    if (!cleanedSearch) return true;

    return `${recipe.name} ${recipe.category} ${recipe.source || ""}`
      .toLowerCase()
      .includes(cleanedSearch);
  });

  const openRecipe = openRecipeId
    ? recipes.find((recipe) => recipe.id === openRecipeId)
    : null;

  return (
    <div className="recipes-panel">
      <div className="recipes-toolbar">
        <div className="recipes-toolbar-text">
          <strong>
            {recipes.length} {recipes.length === 1 ? "recipe" : "recipes"}
          </strong>
          <span>Reuse your saved meals across the week.</span>
        </div>

        <button
          type="button"
          className="add-recipe-toggle"
          aria-expanded={showAddRecipe}
          onClick={() => setShowAddRecipe((open) => !open)}
        >
          <Plus size={15} aria-hidden="true" />
          New recipe
        </button>
      </div>

      {showAddRecipe && (
        <div className="add-item-row">
          <input
            type="text"
            placeholder="Add recipe..."
            value={newRecipeName}
            autoFocus
            onChange={(event) => setNewRecipeName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") addRecipe();
            }}
          />

          <button type="button" onClick={addRecipe}>
            Add
          </button>
        </div>
      )}

      {recipes.length === 0 ? (
        <p className="empty-state">No recipes yet.</p>
      ) : (
        <>
          <div className="recipe-search">
            <Search
              className="recipe-search-icon"
              size={16}
              aria-hidden="true"
            />
            <input
              type="search"
              placeholder="Search recipes..."
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
            />
          </div>

          <RecipeFilter
            label="Category"
            options={categories}
            active={activeCategory}
            onSelect={setActiveCategory}
          />

          <RecipeFilter
            label="Source"
            options={sources}
            active={activeSource}
            onSelect={setActiveSource}
          />

          {visibleRecipes.length === 0 ? (
            <p className="empty-state">No matching recipes.</p>
          ) : (
            <div className="recipe-list">
              {visibleRecipes.map((recipe) => (
                <RecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  onClick={() => setOpenRecipeId(recipe.id)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {openRecipe && (
        <RecipeEditorSheet
          key={openRecipe.id}
          recipe={openRecipe}
          updateRecipe={updateRecipe}
          addIngredientToRecipe={addIngredientToRecipe}
          deleteIngredientFromRecipe={deleteIngredientFromRecipe}
          deleteRecipe={deleteRecipe}
          onClose={() => setOpenRecipeId(null)}
        />
      )}
    </div>
  );
}

export default RecipesList;
