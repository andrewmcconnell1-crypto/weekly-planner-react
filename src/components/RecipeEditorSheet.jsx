import { useEffect, useRef, useState } from "react";
import { ExternalLink, Pencil, Trash2, X } from "lucide-react";

import {
  parseMethodSteps,
  recipeCategories,
  recipeSourceKind,
  recipeSourceLabel,
  recipeTags,
} from "../utils/recipeUtils";
import { useDialogFocus } from "../hooks/useDialogFocus";
import { groupLabelFor } from "../utils/ingredientMatch";


// Bottom-sheet for a single recipe. Opens read-only (viewing is the common
// case); an "Edit recipe" button reveals the edit form.
function RecipeEditorSheet({
  recipe,
  updateRecipe,
  addIngredientToRecipe,
  deleteIngredientFromRecipe,
  deleteRecipe,
  ingredientGroups = {},
  availableGroups = [],
  updateIngredientGroup,
  onClose,
}) {
  const [newIngredient, setNewIngredient] = useState("");
  const [mode, setMode] = useState("view");
  const [closing, setClosing] = useState(false);
  const [groupDrafts, setGroupDrafts] = useState({});
  const closeTimerRef = useRef(null);
  const dialogRef = useRef(null);

  useDialogFocus(dialogRef);

  // The group an ingredient counts as for matching: the in-progress edit if any,
  // else its current resolved group (override or seed). Keyed by the ingredient
  // text so it survives row reordering.
  function groupValueFor(ingredient) {
    return groupDrafts[ingredient] ?? groupLabelFor(ingredient, ingredientGroups);
  }

  function commitGroup(ingredient) {
    updateIngredientGroup?.(ingredient, groupValueFor(ingredient));
  }

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
  const methodSteps = showMethod ? parseMethodSteps(recipe.method) : [];

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
        ref={dialogRef}
        tabIndex={-1}
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
            <X size={16} aria-hidden="true" />
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
                  {recipe.timeMins ? ` · ${recipe.timeMins} min` : ""}
                </span>

                {recipe.tags?.length > 0 && (
                  <span className="recipe-view-tags">
                    {recipe.tags.map((tag) => (
                      <span className="recipe-tag" key={tag}>
                        {tag}
                      </span>
                    ))}
                  </span>
                )}

                {recipe.sourceUrl && (
                  <a
                    className="recipe-source-link"
                    href={recipe.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <ExternalLink size={14} aria-hidden="true" />
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
                  {methodSteps.length > 1 ? (
                    <ol className="recipe-steps">
                      {methodSteps.map((step, index) => (
                        <li key={index}>{step}</li>
                      ))}
                    </ol>
                  ) : (
                    <p className="recipe-view-method">{recipe.method}</p>
                  )}
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
                  <span>Time (mins)</span>
                  <input
                    type="number"
                    min="1"
                    step="5"
                    inputMode="numeric"
                    placeholder="e.g. 30"
                    value={recipe.timeMins ?? ""}
                    onChange={(event) =>
                      updateRecipe(recipe.id, {
                        timeMins:
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

              <div className="recipe-tags-field">
                <p className="section-kicker">Tags</p>
                <div className="recipe-tag-options">
                  {recipeTags.map((tag) => {
                    const active = (recipe.tags || []).includes(tag);
                    return (
                      <button
                        type="button"
                        key={tag}
                        className={`recipe-tag-toggle ${active ? "active" : ""}`}
                        aria-pressed={active}
                        onClick={() =>
                          updateRecipe(recipe.id, {
                            tags: active
                              ? recipe.tags.filter((value) => value !== tag)
                              : [...(recipe.tags || []), tag],
                          })
                        }
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
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
                      <li className="ingredient-row ingredient-row-editing" key={index}>
                        <div className="ingredient-row-line">
                          <span>{ingredient}</span>

                          <button
                            type="button"
                            className="ingredient-delete"
                            aria-label={`Remove ${ingredient}`}
                            onClick={() =>
                              deleteIngredientFromRecipe(recipe.id, index)
                            }
                          >
                            <Trash2 size={16} aria-hidden="true" />
                          </button>
                        </div>

                        {updateIngredientGroup && (
                          <label className="ingredient-group">
                            <span className="ingredient-group-label">
                              Counts as
                            </span>
                            <input
                              type="text"
                              list="recipe-group-options"
                              className="ingredient-group-input"
                              placeholder="(itself)"
                              aria-label={`Group for ${ingredient}`}
                              value={groupValueFor(ingredient)}
                              onChange={(event) =>
                                setGroupDrafts((drafts) => ({
                                  ...drafts,
                                  [ingredient]: event.target.value,
                                }))
                              }
                              onBlur={() => commitGroup(ingredient)}
                              onKeyDown={(event) => {
                                if (event.key === "Enter")
                                  event.currentTarget.blur();
                              }}
                            />
                          </label>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="empty-state">No ingredients yet.</p>
                )}

                <datalist id="recipe-group-options">
                  {availableGroups.map((group) => (
                    <option key={group} value={group} />
                  ))}
                </datalist>

                <p className="small-text ingredient-group-hint">
                  “Counts as” groups an ingredient with what you stock — e.g. set
                  “jasmine rice” to count as “rice”, so rice in your pantry covers
                  it.
                </p>
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
                className="recipe-delete-button with-icon"
                onClick={handleDelete}
              >
                <Trash2 size={16} aria-hidden="true" />
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
