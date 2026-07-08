import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ChefHat,
  ChevronRight,
  ExternalLink,
  PencilLine,
  Repeat2,
  Replace,
  Search,
  ShoppingBag,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  UtensilsCrossed,
  X,
} from "lucide-react";

import RecipeCard from "./RecipeCard";
import RecipeDetail from "./RecipeDetail";
import RecipeFilterSheet from "./RecipeFilterSheet";
import { useRecipeFilters } from "../hooks/useRecipeFilters";
import { useDialogFocus } from "../hooks/useDialogFocus";

// The meal-type choices presented on the chooser step. Each maps to one
// focused detail view, so the user makes a single decision at a time instead
// of facing the whole picker + "or instead" pile at once.
const MEAL_TYPES = [
  {
    id: "swipe",
    icon: Sparkles,
    title: "Swipe to find a meal",
    blurb: "Flip through ideas, add with a swipe",
  },
  {
    id: "recipe",
    icon: ChefHat,
    title: "Browse your recipes",
    blurb: "Search and pick from the list",
  },
  {
    id: "custom",
    icon: PencilLine,
    title: "Custom meal",
    blurb: "Type a one-off meal and any ingredients",
  },
  {
    id: "takeaway",
    icon: ShoppingBag,
    title: "Takeaway",
    blurb: "No cooking, no shopping",
  },
  {
    id: "eating-out",
    icon: UtensilsCrossed,
    title: "Eating out",
    blurb: "Off the plan for the night",
  },
  {
    id: "repeat",
    icon: Repeat2,
    title: "Same as another day",
    blurb: "Reuse a cooked meal as leftovers",
  },
];

// Full-height bottom-sheet editor for a single day's meal. Mounted (keyed by
// day) only while a day is open, so its internal state resets per day.
//
// Wizard-style flow: an empty day opens on a type chooser (Step 1); choosing a
// type — or opening an already-planned day — lands on a focused detail view
// (Step 2) that shows only the controls that type needs, with a "Change type"
// link back to the chooser.
function MealEditorSheet({
  day,
  dateLabel,
  meal,
  days,
  recipes,
  recipeCoverageById,
  linkedRecipe,
  weekDaySummaries = [],
  leftoverNights = 1,
  maxNights = 1,
  onSetNights,
  onClearDay,
  updateMeal,
  onClose,
  onFindMeals,
}) {
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
  const batches = Math.max(1, Math.round(Number(meal.batches) || 1));
  const recipeServes = linkedRecipe?.serves || null;

  const daySummary = weekDaySummaries.find((summary) => summary.day === day);
  const hasMeal = daySummary?.hasMeal ?? false;

  // Map the current meal onto a chooser type, so re-opening a planned day lands
  // on the matching detail view instead of the chooser.
  function viewForMeal() {
    if (!hasMeal) return "chooser";
    if (mealType === "takeaway") return "takeaway";
    if (mealType === "eating-out") return "eating-out";
    if (mealType === "repeat") return "repeat";
    if (isCustomMeal) return "custom";
    return "recipe";
  }

  const [view, setView] = useState(viewForMeal);
  // In the recipe view, a planned day opens in edit mode (no list); flipping
  // this reveals the picker to swap to a different recipe.
  const [changingRecipe, setChangingRecipe] = useState(false);
  const [newIngredient, setNewIngredient] = useState("");
  const recipeFilters = useRecipeFilters(recipes);
  const [recipeFiltersOpen, setRecipeFiltersOpen] = useState(false);
  // "Ready to cook" narrows the picker to recipes the kitchen can already make
  // (this week's basket + recurring + stock), for planning from what you have.
  const [readyOnly, setReadyOnly] = useState(false);
  const [closing, setClosing] = useState(false);

  const hasCoverage = Boolean(recipeCoverageById && recipeCoverageById.size);
  const cookableCount = hasCoverage
    ? recipeFilters.visibleRecipes.filter((recipe) => {
        const tier = recipeCoverageById.get(recipe.id)?.tier;
        return tier === "ready" || tier === "almost";
      }).length
    : 0;
  const nameInputRef = useRef(null);
  const closeTimerRef = useRef(null);
  const dialogRef = useRef(null);
  // The day's meal exactly as it was when this sheet opened, captured once on
  // mount (the sheet is keyed by day, so it remounts per day). "Undo changes"
  // writes this back to discard everything edited in this session.
  const initialMealRef = useRef(meal);

  useDialogFocus(dialogRef);

  // Play the sheet's exit animation, then actually unmount. Guarded by the
  // timer ref so repeated triggers (backdrop + Escape) can't double-close.
  function requestClose() {
    if (closeTimerRef.current) return;
    setClosing(true);
    closeTimerRef.current = window.setTimeout(onClose, 220);
  }

  // Only cooked meals (recipe or custom) can be repeated as leftovers — not
  // takeaway / eating out / other repeats / unplanned days.
  const repeatDaySummaries = weekDaySummaries.filter((summary) => {
    if (summary.day === day) return false;

    return (summary.meal?.mealType || "cook") === "cook" && summary.hasMeal;
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

  // Whether the "Selected" summary card belongs in the current detail view —
  // i.e. the saved meal actually matches the type being shown. Stops a stale
  // "Takeaway" card lingering while the recipe picker is open, for example.
  const currentMatchesView =
    hasMeal &&
    ((view === "recipe" && mealType === "cook" && Boolean(selectedRecipeId)) ||
      (view === "custom" && isCustomMeal && (meal.name || "").trim() !== "") ||
      (view === "takeaway" && mealType === "takeaway") ||
      (view === "eating-out" && mealType === "eating-out") ||
      (view === "repeat" && mealType === "repeat" && meal.repeatFromDay));

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

  // Put the cursor straight in the name field when the custom view opens.
  useEffect(() => {
    if (view === "custom") {
      nameInputRef.current?.focus();
    }
  }, [view]);

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

    updateMeal(day, {
      ...meal,
      mealType: nextMealType,
      recipeId: "",
      repeatFromDay: "",
      name: nextMealType === "takeaway" ? "Takeaway" : "Eating out",
      ingredients: [],
    });
  }

  // Route a chooser tile to its detail view, applying any meal change the
  // choice implies up front (takeaway / eating out are decided on the spot;
  // recipe / repeat wait for a further pick).
  function chooseType(typeId) {
    if (typeId === "swipe") {
      onFindMeals?.();
      return;
    }

    if (typeId === "custom") {
      if (mealType !== "cook" || selectedRecipeId) {
        updateMeal(day, {
          ...meal,
          mealType: "cook",
          recipeId: "",
          repeatFromDay: "",
          name: "",
        });
      }
    } else if (typeId === "takeaway" || typeId === "eating-out") {
      changeMealType(typeId);
    }

    setView(typeId);
  }

  function selectRecipe(recipeId) {
    const selectedRecipe = recipes.find((recipe) => recipe.id === recipeId);

    if (!selectedRecipe) return;

    updateMeal(day, {
      ...meal,
      mealType: "cook",
      name: selectedRecipe.name,
      recipeId: selectedRecipe.id,
      repeatFromDay: "",
    });

    recipeFilters.clearFilters();
    setChangingRecipe(false);
  }

  function clearDay() {
    recipeFilters.clearFilters();
    onClearDay();
    setView("chooser");
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
    requestClose();
  }

  // Discard this session's edits: restore the day's meal to its opening
  // snapshot, then close.
  function undoChanges() {
    updateMeal(day, initialMealRef.current);
    requestClose();
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
                  className="ingredient-delete"
                  aria-label={`Remove ${ingredient}`}
                  onClick={() => deleteIngredient(index)}
                >
                  <Trash2 size={16} aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  function renderCurrentCard() {
    if (!currentMatchesView || !daySummary) return null;

    return (
      <div className="meal-current" data-tone={daySummary.tone}>
        <div className="meal-current-header">
          <div>
            <span className="section-kicker">Selected</span>
            <strong>{daySummary.name}</strong>
            <span className="meal-current-label">
              {daySummary.label}
              {recipeServes ? ` · Serves ${recipeServes}` : ""}
            </span>
          </div>

          {linkedRecipe?.sourceUrl && (
            <div className="meal-current-actions">
              <a
                className="meal-current-source"
                href={linkedRecipe.sourceUrl}
                target="_blank"
                rel="noreferrer"
              >
                <ExternalLink size={14} aria-hidden="true" />
                Source
              </a>
            </div>
          )}
        </div>

        {view === "recipe" && (
          <RecipeDetail
            variant="sheet"
            ingredients={linkedRecipeIngredients}
            method={linkedRecipe?.method || ""}
          />
        )}
      </div>
    );
  }

  function renderNightsAndBatch() {
    return (
      <>
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

        {isCookedMeal && (
          <div className="batch-panel">
            <p className="section-kicker">Batch size</p>

            <div
              className="nights-buttons"
              role="radiogroup"
              aria-label="Batch size"
            >
              {[1, 2, 3].map((size) => (
                <button
                  key={size}
                  type="button"
                  role="radio"
                  aria-checked={batches === size}
                  className={batches === size ? "active" : ""}
                  onClick={() => updateMeal(day, { ...meal, batches: size })}
                >
                  ×{size}
                </button>
              ))}
            </div>

            <p className="nights-hint">
              {batches > 1
                ? `${
                    batches === 2 ? "Double" : batches === 3 ? "Triple" : `×${batches}`
                  } batch${
                    recipeServes
                      ? ` — serves ${recipeServes} → ${recipeServes * batches}`
                      : ""
                  }. Shopping amounts scaled ×${batches}.`
                : recipeServes
                  ? `Single batch — serves ${recipeServes}.`
                  : "Cooking a single batch."}
            </p>
          </div>
        )}
      </>
    );
  }

  function renderChooser() {
    return (
      <div className="meal-type-chooser">
        <p className="meal-type-prompt">How are you eating {day}?</p>

        <div className="meal-type-list">
          {MEAL_TYPES.filter(
            (type) => type.id !== "swipe" || onFindMeals
          ).map((type) => {
            const Icon = type.icon;

            return (
              <button
                key={type.id}
                type="button"
                className="meal-type-tile"
                onClick={() => chooseType(type.id)}
              >
                <span className="meal-type-icon">
                  <Icon size={20} aria-hidden="true" />
                </span>

                <span className="meal-type-text">
                  <strong>{type.title}</strong>
                  <span>{type.blurb}</span>
                </span>

                <ChevronRight
                  className="meal-type-chevron"
                  size={18}
                  aria-hidden="true"
                />
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  function renderRecipeView() {
    // A planned recipe opens in edit mode — just the details and a way to swap
    // — rather than dropping back into the full picker.
    if (selectedRecipeId && !changingRecipe) {
      return (
        <>
          {renderCurrentCard()}
          {renderNightsAndBatch()}

          <button
            type="button"
            className="meal-change-recipe-link"
            onClick={() => setChangingRecipe(true)}
          >
            <Replace size={14} aria-hidden="true" />
            Choose a different recipe
          </button>
        </>
      );
    }

    return (
      <>
        {renderCurrentCard()}
        {renderNightsAndBatch()}

        <div className="meal-picker">
          {onFindMeals && (
            <button
              type="button"
              className="meal-picker-swipe-link"
              onClick={onFindMeals}
            >
              <Sparkles size={14} aria-hidden="true" />
              Or swipe through ideas instead
            </button>
          )}

          <div className="recipe-search-row">
            <div className="recipe-search">
              <Search
                className="recipe-search-icon"
                size={16}
                aria-hidden="true"
              />
              <input
                type="search"
                placeholder="Search recipes..."
                value={recipeFilters.searchText}
                onChange={(event) =>
                  recipeFilters.setSearchText(event.target.value)
                }
              />
            </div>

            <button
              type="button"
              className={`recipe-filter-button ${
                recipeFilters.activeFilterCount > 0 ? "active" : ""
              }`}
              onClick={() => setRecipeFiltersOpen(true)}
            >
              <SlidersHorizontal size={16} aria-hidden="true" />
              Filters
              {recipeFilters.activeFilterCount > 0 && (
                <span className="recipe-filter-count">
                  {recipeFilters.activeFilterCount}
                </span>
              )}
            </button>
          </div>

          {hasCoverage && (
            <label className="ready-filter">
              <span className="ready-filter-label">
                <ChefHat size={15} aria-hidden="true" />
                <span>
                  Only show ready to cook
                  <span className="ready-filter-sub">
                    {cookableCount} you can make from what you have
                  </span>
                </span>
              </span>
              <input
                type="checkbox"
                role="switch"
                className="shop-switch-input"
                checked={readyOnly}
                onChange={(event) => setReadyOnly(event.target.checked)}
              />
            </label>
          )}

          <div className="recipe-picker-results recipe-picker-flat">
            {(() => {
              // Ready-to-cook first (this week's basket + recurring + stock),
              // then near-misses, then the rest in their usual order; the
              // toggle narrows to just the cookable ones.
              const tierRank = (recipe) => {
                const tier = recipeCoverageById?.get(recipe.id)?.tier;
                return tier === "ready" ? 0 : tier === "almost" ? 1 : 2;
              };
              const list = [...recipeFilters.visibleRecipes]
                .filter((recipe) => !readyOnly || tierRank(recipe) < 2)
                .sort((a, b) => tierRank(a) - tierRank(b));

              if (list.length === 0) {
                return (
                  <p className="empty-state">
                    {readyOnly
                      ? "Nothing's ready to cook from what you have yet."
                      : "No matching recipes."}
                  </p>
                );
              }

              return list.map((recipe) => (
                <RecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  active={selectedRecipeId === recipe.id}
                  onClick={() => selectRecipe(recipe.id)}
                  coverage={recipeCoverageById?.get(recipe.id)}
                />
              ));
            })()}
          </div>
        </div>
      </>
    );
  }

  function renderCustomView() {
    return (
      <>
        {renderCurrentCard()}
        {renderNightsAndBatch()}

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

        {renderExtraIngredients("Add ingredient...")}
      </>
    );
  }

  function renderAwayView(label) {
    return (
      <>
        {renderCurrentCard()}

        {!currentMatchesView && (
          <p className="empty-state">Setting {label} for {day}…</p>
        )}

        <p className="meal-away-hint">
          {label} needs nothing else — you&apos;re all set. Tap Save, or change
          the type above.
        </p>
      </>
    );
  }

  function renderRepeatView() {
    return (
      <>
        {renderCurrentCard()}

        <div className="day-choice-grid">
          {repeatDaySummaries.length === 0 ? (
            <p className="empty-state">
              Nothing to repeat yet — plan a cooked meal on another day first.
            </p>
          ) : (
            repeatDaySummaries.map((summary) => (
              <button
                type="button"
                className={
                  mealType === "repeat" && meal.repeatFromDay === summary.day
                    ? "active"
                    : ""
                }
                key={summary.day}
                onClick={() => selectRepeatFromDay(summary.day)}
              >
                <strong>{summary.day.slice(0, 3)}</strong>
                <span>{summary.name}</span>
              </button>
            ))
          )}
        </div>
      </>
    );
  }

  function renderDetail() {
    if (view === "recipe") return renderRecipeView();
    if (view === "custom") return renderCustomView();
    if (view === "takeaway") return renderAwayView("Takeaway");
    if (view === "eating-out") return renderAwayView("Eating out");
    if (view === "repeat") return renderRepeatView();
    return null;
  }

  return (
    <>
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
            onClick={requestClose}
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        <div className="sheet-body">
          {view !== "chooser" && (
            <button
              type="button"
              className="meal-type-back"
              onClick={() => setView("chooser")}
            >
              <ArrowLeft size={16} aria-hidden="true" />
              Change type
            </button>
          )}

          {view === "chooser" ? renderChooser() : renderDetail()}

          {view !== "chooser" && hasMeal && onClearDay && (
            <div className="meal-remove-row">
              <button
                type="button"
                className="meal-current-remove"
                onClick={clearDay}
              >
                <Trash2 size={14} aria-hidden="true" />
                Remove plan
              </button>
            </div>
          )}
        </div>

        <div className="sheet-footer">
          <button type="button" className="secondary" onClick={undoChanges}>
            Undo changes
          </button>

          <button
            type="button"
            className="primary-button"
            onClick={requestClose}
          >
            Save
          </button>
        </div>
      </div>
    </div>

    {recipeFiltersOpen && (
      <RecipeFilterSheet
        filters={recipeFilters}
        onClose={() => setRecipeFiltersOpen(false)}
      />
    )}
    </>
  );
}

export default MealEditorSheet;
