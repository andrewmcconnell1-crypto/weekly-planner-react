import { useEffect, useState } from "react";

import { recipeCategories } from "../utils/recipeUtils";

// Bottom-sheet editor for a single recipe (mounted keyed by recipe id).
function RecipeEditorSheet({
  recipe,
  updateRecipe,
  addIngredientToRecipe,
  deleteIngredientFromRecipe,
  deleteRecipe,
  onClose,
}) {
  const [newIngredient, setNewIngredient] = useState("");

  const categoryOptions =
    recipe.category && !recipeCategories.includes(recipe.category)
      ? [...recipeCategories, recipe.category]
      : recipeCategories;

  // Lock background scroll and close on Escape while the sheet is open.
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKey(event) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", handleKey);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKey);
    };
  }, [onClose]);

  function handleAddIngredient() {
    const cleaned = newIngredient.trim();
    if (cleaned === "") return;
    addIngredientToRecipe(recipe.id, cleaned);
    setNewIngredient("");
  }

  function handleDelete() {
    if (deleteRecipe(recipe.id)) onClose();
  }

  return (
    <div className="sheet-backdrop" role="presentation" onClick={onClose}>
      <div
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-label={`Edit ${recipe.name}`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="sheet-header">
          <div className="sheet-title">
            <strong>Edit recipe</strong>
            <span>{recipe.category || "Uncategorised"}</span>
          </div>

          <button
            type="button"
            className="sheet-close"
            aria-label="Close"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <div className="sheet-body">
          <div className="recipe-detail-fields">
            <label>
              <span>Name</span>
              <input
                type="text"
                value={recipe.name}
                onChange={(event) =>
                  updateRecipe(recipe.id, { name: event.target.value })
                }
              />
            </label>

            <label>
              <span>Category</span>
              <select
                value={recipe.category || "Other"}
                onChange={(event) =>
                  updateRecipe(recipe.id, { category: event.target.value })
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
                  updateRecipe(recipe.id, { source: event.target.value })
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
                  updateRecipe(recipe.id, { sourceUrl: event.target.value })
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

          <div className="meal-extra-ingredients">
            <p className="section-kicker">Ingredients</p>

            <div className="add-item-row">
              <input
                type="text"
                placeholder="Add ingredient..."
                value={newIngredient}
                onChange={(event) => setNewIngredient(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") handleAddIngredient();
                }}
              />

              <button type="button" onClick={handleAddIngredient}>
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
          </div>

          <label className="recipe-method-field">
            <span>Method</span>
            <textarea
              value={recipe.method || ""}
              placeholder="Add method steps..."
              onChange={(event) =>
                updateRecipe(recipe.id, { method: event.target.value })
              }
            />
          </label>
        </div>

        <div className="sheet-footer">
          <button type="button" className="secondary" onClick={onClose}>
            Done
          </button>

          <button
            type="button"
            className="delete-button recipe-delete-button"
            onClick={handleDelete}
          >
            Delete recipe
          </button>
        </div>
      </div>
    </div>
  );
}

export default RecipeEditorSheet;
