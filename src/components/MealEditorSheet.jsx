import { useEffect, useRef, useState } from "react";
import { PencilLine, Repeat2, ShoppingBag, UtensilsCrossed } from "lucide-react";

import { getRecipeTone, groupRecipesByCategory } from "../utils/recipeUtils";

// Full-height bottom-sheet editor for a single day's meal. Mounted (keyed by
// day) only while a day is open, so its internal state resets per day.
//
// Content-first layout: the current pick sits at the top, the recipe list is
// immediately tappable below a search box, and the non-recipe choices
// (custom / takeaway / eating out / repeat) live in a secondary "Or…" row.
function MealEditorSheet({
  day,
  dateLabel,
  meal,
  days,
  recipes,
  linkedRecipe,
  weekDaySummaries = [],
  leftoverNights = 1,
  maxNights = 1,
  onSetNights,
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
  const selectedRecipeId = meal.recipeId || linkedRecipe?.id || "";
  const isCustomMeal = mealType === "cook" && !selectedRecipeId;
  const isCookedMeal =
    mealType === "cook" &&
    (Boolean(selectedRecipeId) || (meal.name || "").trim() !== "");

  // Secondary panels open from the "Or…" row, and start open when the day is
  // already that kind of meal.
  const [showCustomInput, setShowCustomInput] = useState(
    isCustomMeal && (meal.name || "").trim() !== ""
  );
  const [showDayPicker, setShowDayPicker] = useState(mealType === "repeat");

  const daySummary = weekDaySummaries.find((summary) => summary.day === day);
  const hasMeal = daySummary?.hasMeal ?? false;

  const repeatDaySummaries =
    weekDaySummaries.length > 0
      ? weekDaySummaries.filter((summary) => summary.day !== day)
      : days
          .filter((optionDay) => optionDay !== day)
          .map((optionDay) => ({
            day: optionDay,
            name: "No meal planned",
            hasMeal: false,
          }));

  // Flat recipe list, kept in the familiar category order.
  const cleanedRecipeSearch = recipeSearchText.trim().toLowerCase();
  const sortedRecipes = groupRecipesByCategory(recipes).flatMap(
    (group) => group.recipes
  );
  const filteredRecipes = sortedRecipes.filter((recipe) => {
    if (!cleanedRecipeSearch) return true;

    return `${recipe.name} ${recipe.category} ${recipe.source || ""}`
      .toLowerCase()
      .includes(cleanedRecipeSearch);
  });

  // "How many nights?" only makes sense for a cooked meal with nights left in
  // the week to fill with leftovers.
  const showNights = isCookedMeal && Boolean(onSetNights) && maxNights > 1;
  const dayIndex = days.indexOf(day);
  const leftoverDays =
    dayIndex >= 0 ? days.slice(dayIndex + 1, dayIndex + leftoverNights) : [];
  const leftoverDaysLabel =
    leftoverDays.length === 1
      ? leftoverDays[0]
      : `${leftoverDays[0]?.slice(0, 3)} – ${leftoverDays[
          leftoverDays.length - 1
        ]?.slice(0, 3)}`;

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

  // Put the cursor straight in the name field when the custom panel opens.
  useEffect(() => {
    if (showCustomInput) {
      nameInputRef.current?.focus();
    }
  }, [showCustomInput]);

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

  function chooseCustom() {
    setShowDayPicker(false);
    setShowCustomInput(true);

    if (mealType !== "cook" || selectedRecipeId) {
      updateMeal(day, {
        ...meal,
        mealType: "cook",
        recipeId: "",
        repeatFromDay: "",
        name: "",
      });
    }
  }

  function chooseAway(nextMealType) {
    setShowCustomInput(false);
    setShowDayPicker(false);
    changeMealType(nextMealType);
  }

  function chooseRepeat() {
    setShowCustomInput(false);
    setShowDayPicker(true);

    if (mealType !== "repeat") changeMealType("repeat");
  }

  function selectRecipe(recipeId) {
    const selectedRecipe = recipes.find((recipe) => recipe.id === recipeId);

    if (!selectedRecipe) return;

    setShowCustomInput(false);
    setShowDayPicker(false);

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
    updateMeal(day, {
      ...meal,
      mealType: "repeat",
      recipeId: "",
      repeatFromDay,
      name: "",
      ingredients: [],
    });
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
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-label={`${day} meal`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="sheet-header">
          <div className="sheet-title">
            <strong>{day}</strong>
            {dateLabel && <span>{dateLabel}</span>}
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
          {hasMeal && daySummary && (
            <div className="meal-current" data-tone={daySummary.tone}>
              <div className="meal-current-header">
                <div>
                  <span className="section-kicker">Selected</span>
                  <strong>{daySummary.name}</strong>
                  <span className="meal-current-label">{daySummary.label}</span>
                </div>

                {linkedRecipe?.sourceUrl && (
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
                      <li className="ingredient-row read-only-row" key={index}>
                        <span>{ingredient}</span>
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          )}

          {showNights && (
            <div className="nights-panel">
              <p className="section-kicker">How many nights?</p>

              <div
                className="nights-buttons"
                role="radiogroup"
                aria-label={`How many nights for ${day}'s meal`}
              >
                {Array.from({ length: maxNights }, (_, index) => index + 1).map(
                  (nights) => (
                    <button
                      key={nights}
                      type="button"
                      role="radio"
                      aria-checked={leftoverNights === nights}
                      className={leftoverNights === nights ? "active" : ""}
                      onClick={() => onSetNights(nights)}
                    >
                      {nights}
                    </button>
                  )
                )}
              </div>

              <p className="nights-hint">
                {leftoverNights > 1
                  ? `Cook once — leftovers cover ${leftoverDaysLabel}, no extra shopping.`
                  : "Pick more nights to fill the next days with leftovers."}
              </p>
            </div>
          )}

          <div className="meal-picker">
            <p className="section-kicker">
              {hasMeal ? "Change meal" : "Pick a recipe"}
            </p>

            <input
              type="text"
              placeholder="Search recipes..."
              value={recipeSearchText}
              onChange={(event) => setRecipeSearchText(event.target.value)}
            />

            <div className="recipe-picker-results recipe-picker-flat">
              {filteredRecipes.length === 0 ? (
                <p className="empty-state">No matching recipes.</p>
              ) : (
                filteredRecipes.map((recipe) => (
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
                ))
              )}
            </div>
          </div>

          <div className="meal-or-row">
            <p className="section-kicker">Or…</p>

            <div className="meal-or-options">
              <button
                type="button"
                className={showCustomInput && isCustomMeal ? "active" : ""}
                onClick={chooseCustom}
              >
                <PencilLine size={16} aria-hidden="true" />
                Custom meal
              </button>

              <button
                type="button"
                className={mealType === "takeaway" ? "active" : ""}
                onClick={() => chooseAway("takeaway")}
              >
                <ShoppingBag size={16} aria-hidden="true" />
                Takeaway
              </button>

              <button
                type="button"
                className={mealType === "eating-out" ? "active" : ""}
                onClick={() => chooseAway("eating-out")}
              >
                <UtensilsCrossed size={16} aria-hidden="true" />
                Eating out
              </button>

              <button
                type="button"
                className={mealType === "repeat" ? "active" : ""}
                onClick={chooseRepeat}
              >
                <Repeat2 size={16} aria-hidden="true" />
                Same as another day
              </button>
            </div>
          </div>

          {showCustomInput && isCustomMeal && (
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
            </div>
          )}

          {showDayPicker && mealType === "repeat" && (
            <div className="day-choice-grid">
              {repeatDaySummaries.map((summary) => (
                <button
                  type="button"
                  className={meal.repeatFromDay === summary.day ? "active" : ""}
                  key={summary.day}
                  onClick={() => selectRepeatFromDay(summary.day)}
                >
                  <strong>{summary.day.slice(0, 3)}</strong>
                  <span>
                    {summary.hasMeal ? summary.name : "No meal planned"}
                  </span>
                </button>
              ))}
            </div>
          )}

          {mealType === "cook" &&
            (isCookedMeal || showCustomInput) &&
            renderExtraIngredients(
              linkedRecipe ? "Add extra ingredient..." : "Add ingredient..."
            )}
        </div>

        <div className="sheet-footer">
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
