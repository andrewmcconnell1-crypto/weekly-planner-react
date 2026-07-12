import { useMemo, useState } from "react";
import {
  ChevronDown,
  Heart,
  Link2,
  Loader2,
  Plus,
  Search,
  SearchX,
  SlidersHorizontal,
} from "lucide-react";

import {
  importRecipeFromUrl,
  isRecipeImportAvailable,
} from "../lib/recipeImportClient";
import { useRecipeFilters } from "../hooks/useRecipeFilters";
import { rankRecipesByCoverage } from "../utils/recipeCoverage";
import RecipeTile from "./RecipeTile";
import RecipeFilterSheet from "./RecipeFilterSheet";
import RecipeEditorSheet from "./RecipeEditorSheet";
import RecipePlanSheet from "./RecipePlanSheet";

const MODES = [
  { key: "browse", label: "Browse" },
  { key: "foryou", label: "For you" },
  { key: "favourites", label: "Favourites" },
];

const SORTS = [
  { key: "recommended", label: "Recommended" },
  { key: "az", label: "A–Z" },
  { key: "quick", label: "Quickest" },
];

function sortRecipes(list, sort) {
  if (sort === "az") {
    return [...list].sort((a, b) => a.name.localeCompare(b.name));
  }
  if (sort === "quick") {
    const t = (recipe) => recipe.timeMins || Infinity;
    return [...list].sort(
      (a, b) => t(a) - t(b) || a.name.localeCompare(b.name)
    );
  }
  return list; // "recommended" keeps the hook's category-ordered list
}

// The Recipes destination: a visual, browsable home for the whole library.
// Three modes across the top — Browse (grid + search + filters + sort), For you
// (ranked by what the kitchen can cook now), and Favourites — over one tile
// grid. Tapping a tile opens the detail sheet; the heart and "Add to a night"
// act without leaving the grid.
function RecipesScreen({
  recipes,
  favouriteRecipeIdSet,
  onToggleFavourite,
  newRecipeName,
  setNewRecipeName,
  addRecipe,
  addImportedRecipe,
  deleteRecipe,
  addIngredientToRecipe,
  deleteIngredientFromRecipe,
  updateRecipe,
  ingredientGroups,
  availableGroups,
  updateIngredientGroup,
  staples,
  inventory,
  planWeeks,
  onPlanRecipeOnWeekDay,
}) {
  const [mode, setMode] = useState("browse");
  const [sort, setSort] = useState("recommended");
  const [openRecipeId, setOpenRecipeId] = useState(null);
  const [planRecipe, setPlanRecipe] = useState(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [showAddRecipe, setShowAddRecipe] = useState(false);
  const [importUrl, setImportUrl] = useState("");
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState("");

  const filters = useRecipeFilters(recipes);
  const { searchText, setSearchText, visibleRecipes, clearFilters } = filters;

  // "For you": rank every recipe by how much of it the kitchen already covers
  // (stock + active recurring buys). Reuses the Baskets coverage engine.
  const coverageList = useMemo(
    () =>
      rankRecipesByCoverage({
        recipes,
        staples,
        inventory,
        ingredientGroups,
      }),
    [recipes, staples, inventory, ingredientGroups]
  );
  const coverageByRecipe = useMemo(() => {
    const map = new Map();
    coverageList.forEach((entry) => map.set(entry.recipe.id, entry));
    return map;
  }, [coverageList]);

  const favouriteRecipes = useMemo(
    () => recipes.filter((recipe) => favouriteRecipeIdSet.has(recipe.id)),
    [recipes, favouriteRecipeIdSet]
  );

  async function importFromUrl() {
    if (importing || !importUrl.trim()) return;
    setImporting(true);
    setImportError("");
    try {
      const parsed = await importRecipeFromUrl(importUrl);
      const id = addImportedRecipe(parsed);
      setImportUrl("");
      setShowAddRecipe(false);
      setOpenRecipeId(id);
    } catch (error) {
      setImportError(error.message || "Import failed — try again.");
    } finally {
      setImporting(false);
    }
  }

  const openRecipe = openRecipeId
    ? recipes.find((recipe) => recipe.id === openRecipeId)
    : null;

  const canPlan = Boolean(onPlanRecipeOnWeekDay) && planWeeks.length > 0;

  function renderTile(recipe, coverage) {
    return (
      <RecipeTile
        key={recipe.id}
        recipe={recipe}
        coverage={coverage}
        isFavourite={favouriteRecipeIdSet.has(recipe.id)}
        onToggleFavourite={onToggleFavourite}
        onOpen={() => setOpenRecipeId(recipe.id)}
        onPlan={canPlan ? setPlanRecipe : undefined}
      />
    );
  }

  const browseList = sortRecipes(visibleRecipes, sort);

  return (
    <section className="screen recipes-screen">
      <div className="recipes-modes" role="tablist" aria-label="Recipe views">
        {MODES.map((item) => (
          <button
            key={item.key}
            type="button"
            role="tab"
            aria-selected={mode === item.key}
            className={`recipes-mode ${mode === item.key ? "active" : ""}`}
            onClick={() => setMode(item.key)}
          >
            {item.label}
            {item.key === "favourites" && favouriteRecipes.length > 0 && (
              <span className="recipes-mode-count">
                {favouriteRecipes.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {mode === "browse" && (
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

          <div className="recipes-sort-row">
            <span className="recipe-result-count small-text">
              {browseList.length}{" "}
              {browseList.length === 1 ? "recipe" : "recipes"}
            </span>

            <label className="recipes-sort">
              <span className="visually-hidden">Sort recipes</span>
              <div className="select-wrap">
                <select
                  value={sort}
                  onChange={(event) => setSort(event.target.value)}
                >
                  {SORTS.map((option) => (
                    <option key={option.key} value={option.key}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={16}
                  className="select-chevron"
                  aria-hidden="true"
                />
              </div>
            </label>
          </div>

          {browseList.length === 0 ? (
            <div className="recipes-empty">
              <span className="recipes-empty-icon" aria-hidden="true">
                <SearchX size={26} strokeWidth={1.75} />
              </span>
              <strong>No recipes match</strong>
              <p>Try a different search or filter.</p>
              <button type="button" className="secondary" onClick={clearFilters}>
                Clear filters
              </button>
            </div>
          ) : (
            <div className="recipe-grid">
              {browseList.map((recipe) => renderTile(recipe))}
            </div>
          )}

          <div className="recipes-add">
            <button
              type="button"
              className="add-recipe-toggle"
              aria-expanded={showAddRecipe}
              onClick={() => setShowAddRecipe((open) => !open)}
            >
              <Plus size={15} aria-hidden="true" />
              New recipe
            </button>

            {showAddRecipe && (
              <>
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

                {isRecipeImportAvailable && addImportedRecipe && (
                  <div className="recipe-import">
                    <p className="recipe-import-label small-text">
                      …or paste a link and the ingredients and method import
                      themselves:
                    </p>
                    <div className="add-item-row">
                      <input
                        type="url"
                        aria-label="Recipe link to import"
                        placeholder="https://www.recipetineats.com/..."
                        value={importUrl}
                        disabled={importing}
                        onChange={(event) => {
                          setImportUrl(event.target.value);
                          setImportError("");
                        }}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") importFromUrl();
                        }}
                      />
                      <button
                        type="button"
                        onClick={importFromUrl}
                        disabled={importing || !importUrl.trim()}
                      >
                        {importing ? (
                          <Loader2
                            size={15}
                            className="recipe-import-spinner"
                            aria-hidden="true"
                          />
                        ) : (
                          <Link2 size={15} aria-hidden="true" />
                        )}
                        {importing ? "Importing…" : "Import"}
                      </button>
                    </div>
                    {importError && (
                      <p className="recipe-import-error small-text" role="alert">
                        {importError}
                      </p>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}

      {mode === "foryou" && (
        <>
          <p className="recipes-mode-intro small-text">
            Ranked by what you can make from your kitchen right now — stock plus
            your recurring buys.
          </p>
          <div className="recipe-grid">
            {coverageList.map((entry) => renderTile(entry.recipe, entry))}
          </div>
        </>
      )}

      {mode === "favourites" && (
        <>
          {favouriteRecipes.length === 0 ? (
            <div className="recipes-empty">
              <span className="recipes-empty-icon" aria-hidden="true">
                <Heart size={26} strokeWidth={1.75} />
              </span>
              <strong>No favourites yet</strong>
              <p>Tap the heart on any recipe to save it here.</p>
            </div>
          ) : (
            <div className="recipe-grid">
              {favouriteRecipes.map((recipe) =>
                renderTile(recipe, coverageByRecipe.get(recipe.id))
              )}
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

      {planRecipe && (
        <RecipePlanSheet
          recipe={planRecipe}
          planWeeks={planWeeks}
          onPlan={onPlanRecipeOnWeekDay}
          onClose={() => setPlanRecipe(null)}
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
    </section>
  );
}

export default RecipesScreen;
