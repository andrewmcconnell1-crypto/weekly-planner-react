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
import { recommendFromRatings } from "../utils/recipeRecommendations";
import {
  RECIPE_COLLECTIONS,
  collectionRecipes,
} from "../utils/recipeCollections";
import RecipeTile from "./RecipeTile";
import RecipeRow from "./RecipeRow";
import RecipeFilterSheet from "./RecipeFilterSheet";
import RecipeEditorSheet from "./RecipeEditorSheet";
import RecipePlanSheet from "./RecipePlanSheet";

const MODES = [
  { key: "browse", label: "Browse" },
  { key: "foryou", label: "For you" },
  { key: "favourites", label: "Favourites" },
];

const SORTS = [
  { key: "mixed", label: "Mixed" },
  { key: "toprated", label: "Top rated" },
  { key: "az", label: "A–Z" },
  { key: "quick", label: "Quickest" },
];

// A stable pseudo-random key per recipe for the given seed, so "Mixed" mingles
// categories (colours) instead of grouping them, yet stays put while you browse.
function seededKey(id, seed) {
  const str = `${id}:${seed}`;
  let hash = 0;
  for (let i = 0; i < str.length; i += 1) {
    hash = (hash * 31 + str.charCodeAt(i)) | 0;
  }
  return hash;
}

function sortRecipes(list, sort, ratings = {}, seed = 0) {
  if (sort === "az") {
    return [...list].sort((a, b) => a.name.localeCompare(b.name));
  }
  if (sort === "quick") {
    const t = (recipe) => recipe.timeMins || Infinity;
    return [...list].sort(
      (a, b) => t(a) - t(b) || a.name.localeCompare(b.name)
    );
  }
  if (sort === "toprated") {
    const r = (recipe) => ratings[recipe.id] || 0;
    return [...list].sort(
      (a, b) => r(b) - r(a) || a.name.localeCompare(b.name)
    );
  }
  // "mixed" (default): shuffle so the grid isn't a run of one category/colour.
  return [...list].sort(
    (a, b) => seededKey(a.id, seed) - seededKey(b.id, seed)
  );
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
  recipeRatings = {},
  onRateRecipe,
  recipeNotes = {},
  onSaveRecipeNote,
  cookCounts = {},
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
  const [sort, setSort] = useState("mixed");
  // A fresh shuffle seed each time the Recipes tab opens — Mixed feels random
  // per visit but stays stable while you scroll/filter.
  const [mixSeed] = useState(() => Math.floor(Math.random() * 1e9));
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

  // "Ready from your kitchen": cookable now (nothing or almost nothing missing),
  // with your higher-rated recipes rising within each coverage band.
  const readyList = useMemo(
    () =>
      [...coverageList]
        .filter((entry) => entry.missing.length <= 2)
        .sort(
          (a, b) =>
            a.missing.length - b.missing.length ||
            (recipeRatings[b.recipe.id] || 0) -
              (recipeRatings[a.recipe.id] || 0) ||
            a.recipe.name.localeCompare(b.recipe.name)
        )
        .slice(0, 14),
    [coverageList, recipeRatings]
  );

  // "More like your top-rated": suggestions built from your 4–5 star recipes.
  const recommended = useMemo(
    () => recommendFromRatings(recipes, recipeRatings),
    [recipes, recipeRatings]
  );

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
        rating={recipeRatings[recipe.id] || 0}
        cookCount={cookCounts[recipe.id] || 0}
        isFavourite={favouriteRecipeIdSet.has(recipe.id)}
        onToggleFavourite={onToggleFavourite}
        onOpen={() => setOpenRecipeId(recipe.id)}
        onPlan={canPlan ? setPlanRecipe : undefined}
      />
    );
  }

  const browseList = sortRecipes(visibleRecipes, sort, recipeRatings, mixSeed);

  // Switching mode starts you at the top of the new list — otherwise a deep
  // scroll in Browse would land you at the bottom of the shorter Favourites.
  function selectMode(next) {
    setMode(next);
    window.scrollTo(0, 0);
  }

  return (
    <section className="screen recipes-screen">
      <div className="recipes-modes-bar">
        <div className="recipes-modes" role="tablist" aria-label="Recipe views">
          {MODES.map((item) => (
            <button
              key={item.key}
              type="button"
              role="tab"
              aria-selected={mode === item.key}
              className={`recipes-mode ${mode === item.key ? "active" : ""}`}
              onClick={() => selectMode(item.key)}
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
        <div className="recipes-feed">
          {readyList.length === 0 && recommended.length === 0 && (
            <p className="recipes-mode-intro small-text">
              Stock your kitchen and rate a few recipes to make this feed yours —
              meanwhile, here are some collections to browse.
            </p>
          )}

          <RecipeRow
            title="Ready from your kitchen"
            subtitle="Cook these with what you've got — stock plus recurring buys."
          >
            {readyList.map((entry) => renderTile(entry.recipe, entry))}
          </RecipeRow>

          <RecipeRow
            title="More like your top-rated"
            subtitle="Suggestions built from the recipes you rated highly."
          >
            {recommended.map((recipe) => renderTile(recipe))}
          </RecipeRow>

          {RECIPE_COLLECTIONS.map((collection) => (
            <RecipeRow
              key={collection.key}
              title={collection.title}
              subtitle={collection.subtitle}
            >
              {collectionRecipes(recipes, collection).map((recipe) =>
                renderTile(recipe)
              )}
            </RecipeRow>
          ))}
        </div>
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
          rating={recipeRatings[openRecipe.id] || 0}
          onRate={onRateRecipe}
          note={recipeNotes[openRecipe.id] || ""}
          onSaveNote={onSaveRecipeNote}
          cookCount={cookCounts[openRecipe.id] || 0}
          onClose={() => setOpenRecipeId(null)}
        />
      )}
    </section>
  );
}

export default RecipesScreen;
