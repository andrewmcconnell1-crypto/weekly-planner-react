import { useState } from "react";

import { getRecipeTone, groupRecipesByCategory } from "../utils/recipeUtils";
import RecipeEditorSheet from "./RecipeEditorSheet";

const SOURCE_ORDER = ["RecipeTin Eats", "AI originals", "Custom"];

function sourceLabel(recipe) {
  return (recipe.source || "").trim() || "Custom";
}

function sourceKind(recipe) {
  const source = (recipe.source || "").trim().toLowerCase();
  if (source.includes("recipetin")) return "rte";
  if (source.includes("ai")) return "ai";
  return "custom";
}

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

  // Grouped only to get a sensible category order + name sort; we render flat.
  const recipeGroups = groupRecipesByCategory(recipes);
  const categories = ["All", ...recipeGroups.map((group) => group.category)];
  const allRecipes = recipeGroups.flatMap((group) => group.recipes);

  const distinctSources = [...new Set(recipes.map(sourceLabel))].sort((a, b) => {
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
      sourceLabel(recipe) === activeSource;

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
      <p className="small-text">
        Saved meals you can reuse in your weekly plan.
      </p>

      <div className="add-item-row">
        <input
          type="text"
          placeholder="Add recipe..."
          value={newRecipeName}
          onChange={(event) => setNewRecipeName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") addRecipe();
          }}
        />

        <button type="button" onClick={addRecipe}>
          Add
        </button>
      </div>

      {recipes.length === 0 ? (
        <p className="empty-state">No recipes yet.</p>
      ) : (
        <>
          <input
            type="search"
            placeholder="Search recipes..."
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
          />

          <div className="recipe-filter-group">
            <p className="recipe-filter-label">Category</p>
            <div className="recipe-filter-chips" aria-label="Filter by category">
              {categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  className={activeCategory === category ? "active" : ""}
                  onClick={() => setActiveCategory(category)}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {sources.length > 2 && (
            <div className="recipe-filter-group">
              <p className="recipe-filter-label">Source</p>
              <div className="recipe-filter-chips" aria-label="Filter by source">
                {sources.map((source) => (
                  <button
                    key={source}
                    type="button"
                    className={activeSource === source ? "active" : ""}
                    onClick={() => setActiveSource(source)}
                  >
                    {source}
                  </button>
                ))}
              </div>
            </div>
          )}

          {visibleRecipes.length === 0 ? (
            <p className="empty-state">No matching recipes.</p>
          ) : (
            <div className="recipe-list">
              {visibleRecipes.map((recipe) => (
                <button
                  key={recipe.id}
                  type="button"
                  className="recipe-row"
                  data-tone={getRecipeTone(recipe.category)}
                  onClick={() => setOpenRecipeId(recipe.id)}
                >
                  <span className="recipe-row-main">
                    <strong>{recipe.name}</strong>
                    <span>
                      {recipe.category || "Uncategorised"}
                      {recipe.serves ? ` · Serves ${recipe.serves}` : ""}
                    </span>
                  </span>

                  <span className="recipe-source" data-source={sourceKind(recipe)}>
                    {sourceLabel(recipe)}
                  </span>

                  <span className="recipe-row-chevron">›</span>
                </button>
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
