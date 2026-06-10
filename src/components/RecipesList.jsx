import { useState } from "react";

import {
  getRecipeTone,
  groupRecipesByCategory,
  recipeCategories,
} from "../utils/recipeUtils";

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
  const [expandedRecipeId, setExpandedRecipeId] = useState(null);
  const [ingredientTextByRecipe, setIngredientTextByRecipe] = useState({});
  const [openCategoryByName, setOpenCategoryByName] = useState({});
  const recipeGroups = groupRecipesByCategory(recipes);

  function updateIngredientText(recipeId, value) {
    setIngredientTextByRecipe({
      ...ingredientTextByRecipe,
      [recipeId]: value,
    });
  }

  function handleAddIngredient(recipeId) {
    const ingredient = ingredientTextByRecipe[recipeId] || "";

    addIngredientToRecipe(recipeId, ingredient);

    setIngredientTextByRecipe({
      ...ingredientTextByRecipe,
      [recipeId]: "",
    });
  }

  function toggleRecipe(recipeId) {
    setExpandedRecipeId(expandedRecipeId === recipeId ? null : recipeId);
  }

  function toggleCategory(category, index) {
    const isOpen = openCategoryByName[category] ?? index === 0;

    setOpenCategoryByName({
      ...openCategoryByName,
      [category]: !isOpen,
    });
  }

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
        <div className="recipe-groups">
          {recipeGroups.map((group, index) => {
            const isCategoryOpen =
              openCategoryByName[group.category] ?? index === 0;

            return (
              <section
                className="recipe-group"
                data-tone={group.tone}
                key={group.category}
              >
                <button
                  className="recipe-group-heading"
                  type="button"
                  aria-expanded={isCategoryOpen}
                  onClick={() => toggleCategory(group.category, index)}
                >
                  <span>
                    <strong>{group.category}</strong>
                    <span>
                      {group.recipes.length} recipe
                      {group.recipes.length === 1 ? "" : "s"}
                    </span>
                  </span>

                  <span className="recipe-group-count">
                    {isCategoryOpen ? "Hide" : "Show"}
                  </span>
                </button>

                {isCategoryOpen && (
                  <ul className="recipes-list">
                    {group.recipes.map((recipe) => {
                      const isExpanded = expandedRecipeId === recipe.id;
                      const ingredientCount = recipe.ingredients.length;
                      const categoryOptions =
                        recipe.category &&
                        !recipeCategories.includes(recipe.category)
                          ? [...recipeCategories, recipe.category]
                          : recipeCategories;

                      return (
                        <li
                          className={`card recipe-card ${
                            isExpanded ? "expanded" : ""
                          }`}
                          data-tone={getRecipeTone(recipe.category)}
                          key={recipe.id}
                        >
                          <button
                            className="recipe-summary-button"
                            type="button"
                            aria-expanded={isExpanded}
                            onClick={() => toggleRecipe(recipe.id)}
                          >
                            <span className="recipe-summary-main">
                              <strong>{recipe.name}</strong>
                              <span>{recipe.category || "Uncategorised"}</span>
                              {recipe.source && (
                                <span className="recipe-summary-source">
                                  {recipe.source}
                                </span>
                              )}
                            </span>

                            <span className="recipe-count">
                              {ingredientCount} ingredient
                              {ingredientCount === 1 ? "" : "s"}
                            </span>
                          </button>

                          {isExpanded && (
                            <div className="recipe-editor">
                              <div className="recipe-detail-fields">
                                <label>
                                  <span>Name</span>
                                  <input
                                    type="text"
                                    value={recipe.name}
                                    onChange={(event) =>
                                      updateRecipe(recipe.id, {
                                        name: event.target.value,
                                      })
                                    }
                                  />
                                </label>

                                <label>
                                  <span>Category</span>
                                  <select
                                    value={recipe.category || "Other"}
                                    onChange={(event) =>
                                      updateRecipe(recipe.id, {
                                        category: event.target.value,
                                      })
                                    }
                                  >
                                    {categoryOptions.map((category) => (
                                      <option key={category} value={category}>
                                        {category}
                                      </option>
                                    ))}
                                  </select>
                                </label>

                                <label>
                                  <span>Source</span>
                                  <input
                                    type="text"
                                    placeholder="e.g. RecipeTin Eats"
                                    value={recipe.source || ""}
                                    onChange={(event) =>
                                      updateRecipe(recipe.id, {
                                        source: event.target.value,
                                      })
                                    }
                                  />
                                </label>

                                <label>
                                  <span>Source link</span>
                                  <input
                                    type="url"
                                    placeholder="https://..."
                                    value={recipe.sourceUrl || ""}
                                    onChange={(event) =>
                                      updateRecipe(recipe.id, {
                                        sourceUrl: event.target.value,
                                      })
                                    }
                                  />
                                </label>

                                {recipe.sourceUrl && (
                                  <a
                                    className="recipe-source-link"
                                    href={recipe.sourceUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                  >
                                    Open source link
                                  </a>
                                )}
                              </div>

                              <div className="add-item-row">
                                <input
                                  type="text"
                                  placeholder="Add ingredient..."
                                  value={ingredientTextByRecipe[recipe.id] || ""}
                                  onChange={(event) =>
                                    updateIngredientText(
                                      recipe.id,
                                      event.target.value
                                    )
                                  }
                                  onKeyDown={(event) => {
                                    if (event.key === "Enter") {
                                      handleAddIngredient(recipe.id);
                                    }
                                  }}
                                />

                                <button
                                  type="button"
                                  onClick={() => handleAddIngredient(recipe.id)}
                                >
                                  Add
                                </button>
                              </div>

                              {recipe.ingredients.length > 0 ? (
                                <ul className="ingredient-list">
                                  {recipe.ingredients.map((ingredient, itemIndex) => (
                                    <li className="ingredient-row" key={itemIndex}>
                                      <span>{ingredient}</span>

                                      <button
                                        type="button"
                                        className="delete-button"
                                        onClick={() =>
                                          deleteIngredientFromRecipe(
                                            recipe.id,
                                            itemIndex
                                          )
                                        }
                                      >
                                        Delete
                                      </button>
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <p className="empty-state">No ingredients yet.</p>
                              )}

                              <label className="recipe-method-field">
                                <span>Method</span>
                                <textarea
                                  value={recipe.method || ""}
                                  placeholder="Add method steps..."
                                  onChange={(event) =>
                                    updateRecipe(recipe.id, {
                                      method: event.target.value,
                                    })
                                  }
                                />
                              </label>

                              <div className="recipe-editor-actions">
                                <button
                                  type="button"
                                  className="secondary"
                                  onClick={() => toggleRecipe(recipe.id)}
                                >
                                  Done
                                </button>

                                <button
                                  type="button"
                                  className="delete-button recipe-delete-button"
                                  onClick={() => deleteRecipe(recipe.id)}
                                >
                                  Delete recipe
                                </button>
                              </div>
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default RecipesList;
