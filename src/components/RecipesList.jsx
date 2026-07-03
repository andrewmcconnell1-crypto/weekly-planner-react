import { useState } from "react";
import { BookOpen, Plus, Search, SearchX, SlidersHorizontal } from "lucide-react";

import { useRecipeFilters } from "../hooks/useRecipeFilters";
import RecipeCard from "./RecipeCard";
import RecipeEditorSheet from "./RecipeEditorSheet";
import RecipeFilterSheet from "./RecipeFilterSheet";

function RecipesList({
  recipes,
  newRecipeName,
  setNewRecipeName,
  addRecipe,
  deleteRecipe,
  addIngredientToRecipe,
  deleteIngredientFromRecipe,
  updateRecipe,
  ingredientGroups,
  availableGroups,
  updateIngredientGroup,
}) {
  const [openRecipeId, setOpenRecipeId] = useState(null);
  // Adding a recipe is a rare action, so it stays tucked behind a quiet toggle.
  const [showAddRecipe, setShowAddRecipe] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const filters = useRecipeFilters(recipes);
  const { searchText, setSearchText, visibleRecipes, clearFilters } = filters;

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
        <div className="recipes-empty">
          <span className="recipes-empty-icon" aria-hidden="true">
            <BookOpen size={26} strokeWidth={1.75} />
          </span>
          <strong>No recipes yet</strong>
          <p>
            Save the meals you cook often so you can drop them straight into
            your week.
          </p>
          <button type="button" onClick={() => setShowAddRecipe(true)}>
            <Plus size={16} aria-hidden="true" />
            Add your first recipe
          </button>
        </div>
      ) : (
        <>
          <div className="recipe-search-row">
            <div className="recipe-search">
              <Search
                className="recipe-search-icon"
                size={16}
                aria-hidden="true"
              />
              <input
                type="search"
                aria-label="Search recipes"
                placeholder="Search recipes..."
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
              />
            </div>

            <button
              type="button"
              className={`recipe-filter-button ${
                filters.activeFilterCount > 0 ? "active" : ""
              }`}
              onClick={() => setFiltersOpen(true)}
            >
              <SlidersHorizontal size={16} aria-hidden="true" />
              Filters
              {filters.activeFilterCount > 0 && (
                <span className="recipe-filter-count">
                  {filters.activeFilterCount}
                </span>
              )}
            </button>
          </div>

          {(filters.activeFilterCount > 0 || searchText) && (
            <p className="recipe-result-count small-text">
              {visibleRecipes.length} of {recipes.length} recipes
            </p>
          )}

          {visibleRecipes.length === 0 ? (
            <div className="recipes-empty">
              <span className="recipes-empty-icon" aria-hidden="true">
                <SearchX size={26} strokeWidth={1.75} />
              </span>
              <strong>No recipes match</strong>
              <p>Try a different search or category.</p>
              <button type="button" className="secondary" onClick={clearFilters}>
                Clear filters
              </button>
            </div>
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

      {filtersOpen && (
        <RecipeFilterSheet
          filters={filters}
          onClose={() => setFiltersOpen(false)}
        />
      )}

      {openRecipe && (
        <RecipeEditorSheet
          key={openRecipe.id}
          recipe={openRecipe}
          updateRecipe={updateRecipe}
          addIngredientToRecipe={addIngredientToRecipe}
          deleteIngredientFromRecipe={deleteIngredientFromRecipe}
          deleteRecipe={deleteRecipe}
          ingredientGroups={ingredientGroups}
          availableGroups={availableGroups}
          updateIngredientGroup={updateIngredientGroup}
          onClose={() => setOpenRecipeId(null)}
        />
      )}
    </div>
  );
}

export default RecipesList;
