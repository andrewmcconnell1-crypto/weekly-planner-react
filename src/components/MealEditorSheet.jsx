import { useEffect, useRef, useState } from "react";

import { getRecipeTone, groupRecipesByCategory } from "../utils/recipeUtils";

// Full-height bottom-sheet editor for a single day's meal. Mounted (keyed by
// day) only while a day is open, so its internal state resets per day.
function MealEditorSheet({
  day,
  dateLabel,
  meal,
  days,
  recipes,
  linkedRecipe,
  weekDaySummaries = [],
  updateMeal,
  onClose,
  onNextDay,
}) {
  const [newIngredient, setNewIngredient] = useState("");
  const [recipeSearchText, setRecipeSearchText] = useState("");
  const nameInputRef = useRef(null);

  const manualIngredients = Array.isArray(meal.ingredients)
    ? meal.ingredients
    : [];
  const linkedRecipeIngredients = linkedRecipe?.ingredients || [];
  const mealType = meal.mealType || "cook";
  const recipeGroups = groupRecipesByCategory(recipes);
  const selectedRecipeId = meal.recipeId || linkedRecipe?.id || "";
  const derivedEditorMode =
    mealType === "cook"
      ? selectedRecipeId
        ? "recipe"
        : "custom"
      : mealType;
  const [editorMode, setEditorMode] = useState(derivedEditorMode);

  const repeatDaySummaries =
    weekDaySummaries.length > 0
      ? weekDaySummaries.filter((daySummary) => daySummary.day !== day)
      : days
          .filter((optionDay) => optionDay !== day)
          .map((optionDay) => ({
            day: optionDay,
            name: "No meal planned",
            hasMeal: false,
          }));

  const cleanedRecipeSearch = recipeSearchText.trim().toLowerCase();
  const filteredRecipeGroups = recipeGroups
    .map((group) => ({
      ...group,
      recipes: group.recipes.filter((recipe) => {
        if (!cleanedRecipeSearch) return true;

        return `${recipe.name} ${recipe.category} ${recipe.source || ""}`
          .toLowerCase()
          .includes(cleanedRecipeSearch);
      }),
    }))
    .filter((group) => group.recipes.length > 0);

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

  // Put the cursor straight in the name field when in custom mode.
  useEffect(() => {
    if (editorMode === "custom") {
      nameInputRef.current?.focus();
    }
  }, [editorMode]);

  function changeMealType(nextMealType) {
    if (nextMealType === "cook") {
      updateMeal(day, {
        ...meal,
        mealType: "cook",
        repeatFromDay: "",
        name:
          mealType === "takeaway" || mealType === "eating-out" ? "" : meal.name,
      });
      return;
    }

    if (nextMealType === "repeat") {
      updateMeal(day, {
        ...meal,
        mealType: "repeat",
        recipeId: "",
        repeatFromDay:
          meal.repeatFromDay && meal.repeatFromDay !== day
            ? meal.repeatFromDay
            : "",
        name: "",
        ingredients: [],
      });
      return;
    }

    updateMeal(day, {
      ...meal,
      mealType: nextMealType,
      recipeId: "",
      repeatFromDay: "",
      name: nextMealType === "takeaway" ? "Takeaway" : "Eating out",
      ingredients: [],
    });
  }

  function selectEditorMode(nextEditorMode) {
    setEditorMode(nextEditorMode);

    if (nextEditorMode === "recipe") {
      changeMealType("cook");
      return;
    }

    if (nextEditorMode === "custom") {
      updateMeal(day, {
        ...meal,
        mealType: "cook",
        recipeId: "",
        repeatFromDay: "",
        name: mealType !== "cook" || selectedRecipeId ? "" : meal.name,
      });
      return;
    }

    changeMealType(nextEditorMode);
  }

  function addIngredient() {
    const cleanedIngredient = newIngredient.trim();

    if (cleanedIngredient === "") return;

    updateMeal(day, {
      ...meal,
      mealType: "cook",
      ingredients: [...manualIngredients, cleanedIngredient],
    });

    setNewIngredient("");
  }

  function deleteIngredient(indexToDelete) {
    updateMeal(day, {
      ...meal,
      ingredients: manualIngredients.filter(
        (_, index) => index !== indexToDelete
      ),
    });
  }

  function selectRecipe(recipeId) {
    const selectedRecipe = recipes.find((recipe) => recipe.id === recipeId);
    setEditorMode("recipe");

    if (!selectedRecipe) {
      updateMeal(day, { ...meal, mealType: "cook", recipeId: "" });
      return;
    }

    updateMeal(day, {
      ...meal,
      mealType: "cook",
      name: selectedRecipe.name,
      recipeId: selectedRecipe.id,
      repeatFromDay: "",
    });

    setRecipeSearchText("");
  }

  function selectRepeatFromDay(repeatFromDay) {
    setEditorMode("repeat");

    updateMeal(day, {
      ...meal,
      mealType: "repeat",
      recipeId: "",
      repeatFromDay,
      name: "",
      ingredients: [],
    });
  }

  function finishDay() {
    if (onNextDay) {
      onNextDay();
    } else {
      onClose();
    }
  }

  function renderExtraIngredients(placeholder) {
    return (
      <div className="meal-extra-ingredients">
        <p className="section-kicker">Extra ingredients</p>

        <div className="add-item-row">
          <input
            type="text"
            placeholder={placeholder}
            value={newIngredient}
            onChange={(event) => setNewIngredient(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") addIngredient();
            }}
          />

          <button type="button" onClick={addIngredient}>
            Add
          </button>
        </div>

        {manualIngredients.length > 0 && (
          <ul className="ingredient-list">
            {manualIngredients.map((ingredient, index) => (
              <li className="ingredient-row" key={index}>
                <span>{ingredient}</span>

                <button
                  type="button"
                  className="delete-button"
                  onClick={() => deleteIngredient(index)}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  return (
    <div className="sheet-backdrop" role="presentation" onClick={onClose}>
      <div
        className="meal-sheet"
        role="dialog"
        aria-modal="true"
        aria-label={`${day} meal`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="meal-sheet-header">
          <div className="meal-sheet-title">
            <strong>{day}</strong>
            {dateLabel && <span>{dateLabel}</span>}
          </div>

          <button
            type="button"
            className="meal-sheet-close"
            aria-label="Close"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <div className="meal-sheet-body">
          <div className="meal-action-grid" aria-label={`${day} meal type`}>
            <button
              type="button"
              className={editorMode === "recipe" ? "active" : ""}
              onClick={() => selectEditorMode("recipe")}
            >
              Recipe
            </button>

            <button
              type="button"
              className={editorMode === "custom" ? "active" : ""}
              onClick={() => selectEditorMode("custom")}
            >
              Custom
            </button>

            <button
              type="button"
              className={editorMode === "repeat" ? "active" : ""}
              onClick={() => selectEditorMode("repeat")}
            >
              Repeat
            </button>

            <button
              type="button"
              className={editorMode === "takeaway" ? "active" : ""}
              onClick={() => selectEditorMode("takeaway")}
            >
              Takeaway
            </button>

            <button
              type="button"
              className={editorMode === "eating-out" ? "active" : ""}
              onClick={() => selectEditorMode("eating-out")}
            >
              Out
            </button>
          </div>

          {editorMode === "recipe" && (
            <div className="meal-mode-panel">
              {linkedRecipe && (
                <div className="linked-recipe-panel">
                  <div className="linked-recipe-header">
                    <div>
                      <span>Linked recipe</span>
                      <strong>{linkedRecipe.name}</strong>
                    </div>

                    {linkedRecipe.sourceUrl && (
                      <a
                        href={linkedRecipe.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Source
                      </a>
                    )}
                  </div>

                  {linkedRecipeIngredients.length > 0 && (
                    <details className="meal-details">
                      <summary>
                        Recipe ingredients ({linkedRecipeIngredients.length})
                      </summary>

                      <ul className="ingredient-list recipe-ingredient-list">
                        {linkedRecipeIngredients.map((ingredient, index) => (
                          <li
                            className="ingredient-row read-only-row"
                            key={index}
                          >
                            <span>{ingredient}</span>
                          </li>
                        ))}
                      </ul>
                    </details>
                  )}
                </div>
              )}

              <input
                type="text"
                placeholder="Search recipes..."
                value={recipeSearchText}
                onChange={(event) => setRecipeSearchText(event.target.value)}
              />

              <div className="recipe-picker-results">
                {filteredRecipeGroups.length === 0 ? (
                  <p className="empty-state">No matching recipes.</p>
                ) : (
                  filteredRecipeGroups.map((group) => (
                    <details
                      className="recipe-picker-group"
                      key={group.category}
                      open={Boolean(cleanedRecipeSearch)}
                    >
                      <summary>
                        <span>{group.category}</span>
                        <span>{group.recipes.length}</span>
                      </summary>

                      <div className="recipe-choice-list">
                        {group.recipes.map((recipe) => (
                          <button
                            type="button"
                            className={`recipe-choice ${
                              selectedRecipeId === recipe.id ? "active" : ""
                            }`}
                            data-tone={getRecipeTone(recipe.category)}
                            key={recipe.id}
                            onClick={() => selectRecipe(recipe.id)}
                          >
                            <span>
                              <strong>{recipe.name}</strong>
                              <span>{recipe.category}</span>
                            </span>

                            <span className="recipe-choice-count">
                              {recipe.ingredients.length}
                            </span>
                          </button>
                        ))}
                      </div>
                    </details>
                  ))
                )}
              </div>

              {renderExtraIngredients(
                linkedRecipe ? "Add extra ingredient..." : "Add ingredient..."
              )}
            </div>
          )}

          {editorMode === "custom" && (
            <div className="meal-mode-panel">
              <input
                ref={nameInputRef}
                type="text"
                placeholder="Meal name..."
                value={meal.name}
                onChange={(event) =>
                  updateMeal(day, {
                    ...meal,
                    mealType: "cook",
                    recipeId: "",
                    repeatFromDay: "",
                    name: event.target.value,
                  })
                }
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    finishDay();
                  }
                }}
              />

              {renderExtraIngredients("Add ingredient...")}
            </div>
          )}

          {editorMode === "repeat" && (
            <div className="day-choice-grid">
              {repeatDaySummaries.map((daySummary) => (
                <button
                  type="button"
                  className={
                    meal.repeatFromDay === daySummary.day ? "active" : ""
                  }
                  key={daySummary.day}
                  onClick={() => selectRepeatFromDay(daySummary.day)}
                >
                  <strong>{daySummary.day.slice(0, 3)}</strong>
                  <span>
                    {daySummary.hasMeal ? daySummary.name : "No meal planned"}
                  </span>
                </button>
              ))}
            </div>
          )}

          {(editorMode === "takeaway" || editorMode === "eating-out") && (
            <div className="meal-status-card">
              <strong>
                {editorMode === "takeaway" ? "Takeaway" : "Eating out"}
              </strong>
              <span>No shopping needed</span>
            </div>
          )}
        </div>

        <div className="meal-sheet-footer">
          <button type="button" className="secondary" onClick={onClose}>
            Done
          </button>

          {onNextDay && (
            <button type="button" className="primary-button" onClick={onNextDay}>
              Next day
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default MealEditorSheet;
