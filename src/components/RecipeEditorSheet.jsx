import { useEffect, useRef, useState } from "react";
import { Pencil } from "lucide-react";

import {
  recipeCategories,
  recipeSourceKind,
  recipeSourceLabel,
} from "../utils/recipeUtils";

// Bottom-sheet for a single recipe. Opens read-only (viewing is the common
// case); an "Edit recipe" button reveals the edit form.
function RecipeEditorSheet({
  recipe,
  updateRecipe,
  addIngredientToRecipe,
  deleteIngredientFromRecipe,
  deleteRecipe,
  onClose,
}) {
  const [newIngredient, setNewIngredient] = useState("");
  const [mode, setMode] = useState("view");
  const [closing, setClosing] = useState(false);
  const closeTimerRef = useRef(null);

  // Play the sheet's exit animation, then unmount.
  function requestClose() {
    if (closeTimerRef.current) return;
    setClosing(true);
    closeTimerRef.current = window.setTimeout(onClose, 220);
  }

  const categoryOptions =
    recipe.category && !recipeCategories.includes(recipe.category)
      ? [...recipeCategories, recipe.category]
      : recipeCategories;

  // Show the method inline when the recipe carries its own (no source link).
  const showMethod = Boolean(recipe.method) && !recipe.sourceUrl;

  // Lock background scroll and close on Escape while the sheet is open.
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKey(event) {
      if (event.key === "Escape") requestClose();
    }

    window.addEventListener("keydown", handleKey);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onClose]);

  // Clear any pending close timer if the sheet unmounts first.
  useEffect(() => () => window.clearTimeout(closeTimerRef.current), []);

  function handleAddIngredient() {
    const cleaned = newIngredient.trim();
    if (cleaned === "") return;
    addIngredientToRecipe(recipe.id, cleaned);
    setNewIngredient("");
  }

  function handleDelete() {
    if (deleteRecipe(recipe.id)) requestClose();
  }

  return (
    <div
      className={`sheet-backdrop ${closing ? "closing" : ""}`}
      role="presentation"
      onClick={requestClose}
    >
      <div
        className={`sheet ${closing ? "closing" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label={recipe.name}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="sheet-header">
          <div className="sheet-title">
            <strong>{mode === "view" ? "Recipe" : "Edit recipe"}</strong>
            <span>{recipe.category || "Uncategorised"}</span>
          </div>

          <button
            type="button"
            className="sheet-close"
            aria-label="Close"
            onClick={requestClose}
          >
            ✕
          </button>
        </div>

        <div className="sheet-body">
          {mode === "view" ? (
            <div className="recipe-view">
              <div className="recipe-view-head">
                <span
                  className="recipe-source"
                  data-source={recipeSourceKind(recipe)}
                >
                  {recipeSourceLabel(recipe)}
                </span>

                <strong className="recipe-view-name">{recipe.name}</strong>

                <span className="recipe-view-meta">
                  {recipe.category || "Uncategorised"}
                  {recipe.serves ? ` · Serves ${recipe.serves}` : ""}
                </span>

                {recipe.sourceUrl && (
                  <a
                    className="recipe-source-link"
                    href={recipe.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open source recipe
                  </a>
                )}
              </div>

              <div className="recipe-view-section">
                <p className="section-kicker">
                  Ingredients ({recipe.ingredients.length})
                </p>

                {recipe.ingredients.length > 0 ? (
                  <ul className="ingredient-list recipe-ingredient-list">
                    {recipe.ingredients.map((ingredient, index) => (
                      <li className="ingredient-row read-only-row" key={index}>
                        <span>{ingredient}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="empty-state">No ingredients yet.</p>
                )}
              </div>

              {showMethod && (
                <div className="recipe-view-section">
                  <p className="section-kicker">Method</p>
                  <p className="recipe-view-method">{recipe.method}</p>
                </div>
              )}
            </div>
          ) : (
            <>
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
                  <span>Serves</span>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    inputMode="numeric"
                    placeholder="e.g. 4"
                    value={recipe.serves ?? ""}
                    onChange={(event) =>
                      updateRecipe(recipe.id, {
                        serves:
                          event.target.value === ""
                            ? null
                            : Number(event.target.value),
                      })
                    }
                  />
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
            </>
          )}
        </div>

        <div className="sheet-footer">
          {mode === "view" ? (
            <>
              <button type="button" className="secondary" onClick={requestClose}>
                Done
              </button>

              <button
                type="button"
                className="primary-button with-icon"
                onClick={() => setMode("edit")}
              >
                <Pencil size={16} aria-hidden="true" />
                Edit recipe
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className="secondary"
                onClick={() => setMode("view")}
              >
                Done editing
              </button>

              <button
                type="button"
                className="delete-button recipe-delete-button"
                onClick={handleDelete}
              >
                Delete recipe
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default RecipeEditorSheet;
