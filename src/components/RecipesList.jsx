import { useState } from "react";

function RecipesList({
  recipes,
  newRecipeName,
  setNewRecipeName,
  addRecipe,
  deleteRecipe,
  addIngredientToRecipe,
  deleteIngredientFromRecipe,
  updateRecipeMethod,
}) {
  const [expandedRecipeId, setExpandedRecipeId] = useState(null);
  const [ingredientTextByRecipe, setIngredientTextByRecipe] = useState({});

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
        <ul className="recipes-list">
          {recipes.map((recipe) => {
            const isExpanded = expandedRecipeId === recipe.id;
            const ingredientCount = recipe.ingredients.length;

            return (
              <li
                className={`card recipe-card ${isExpanded ? "expanded" : ""}`}
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
                    <div className="recipe-meta">
                      <span>{recipe.category || "Uncategorised"}</span>

                      {recipe.sourceUrl ? (
                        <a
                          href={recipe.sourceUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {recipe.source || "Open source"}
                        </a>
                      ) : (
                        <span>{recipe.source || "No source set"}</span>
                      )}
                    </div>

                    <div className="add-item-row">
                      <input
                        type="text"
                        placeholder="Add ingredient..."
                        value={ingredientTextByRecipe[recipe.id] || ""}
                        onChange={(event) =>
                          updateIngredientText(recipe.id, event.target.value)
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
                        {recipe.ingredients.map((ingredient, index) => (
                          <li className="ingredient-row" key={index}>
                            <span>{ingredient}</span>

                            <button
                              type="button"
                              className="delete-button"
                              onClick={() =>
                                deleteIngredientFromRecipe(recipe.id, index)
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
                          updateRecipeMethod(recipe.id, event.target.value)
                        }
                      />
                    </label>

                    <button
                      type="button"
                      className="delete-button recipe-delete-button"
                      onClick={() => deleteRecipe(recipe.id)}
                    >
                      Delete Recipe
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default RecipesList;
