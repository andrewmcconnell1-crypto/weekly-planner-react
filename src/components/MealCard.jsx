import { useState } from "react";

import { groupRecipesByCategory } from "../utils/recipeUtils";

function MealCard({
  day,
  meal,
  days,
  recipes,
  linkedRecipe,
  displayName,
  mealLabel,
  mealTone,
  ingredientCount,
  updateMeal,
  isExpanded,
  toggleExpanded,
}) {
  const [newIngredient, setNewIngredient] = useState("");
  const manualIngredients = Array.isArray(meal.ingredients)
    ? meal.ingredients
    : [];
  const linkedRecipeIngredients = linkedRecipe?.ingredients || [];
  const mealType = meal.mealType || "cook";
  const repeatDayOptions = days.filter((optionDay) => optionDay !== day);
  const recipeGroups = groupRecipesByCategory(recipes);

  function changeMealType(nextMealType) {
    if (nextMealType === "cook") {
      updateMeal(day, {
        ...meal,
        mealType: "cook",
        repeatFromDay: "",
        name:
          mealType === "takeaway" || mealType === "eating-out"
            ? ""
            : meal.name,
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

  function addIngredient() {
    const cleanedIngredient = newIngredient.trim();

    if (cleanedIngredient === "") return;

    updateMeal(day, {
      ...meal,
      mealType: "cook",
      ingredients: [
        ...manualIngredients,
        cleanedIngredient,
      ],
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

    if (!selectedRecipe) {
      updateMeal(day, {
        ...meal,
        mealType: "cook",
        recipeId: "",
      });
      return;
    }

    updateMeal(day, {
      ...meal,
      mealType: "cook",
      name: selectedRecipe.name,
      recipeId: selectedRecipe.id,
      repeatFromDay: "",
    });
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

  const mealName = displayName || (meal.name || "").trim() || "No meal planned";
  const visibleIngredientCount =
    ingredientCount ?? manualIngredients.length;
  const ingredientLabel = `${visibleIngredientCount} ingredient${
    visibleIngredientCount === 1 ? "" : "s"
  }`;
  const rowBadge =
    mealType === "cook"
      ? ingredientLabel
      : mealType === "repeat"
        ? "Repeat"
        : mealType === "takeaway"
          ? "Takeaway"
          : "Out";
  const selectedRecipeId = meal.recipeId || linkedRecipe?.id || "";
  const hasPlannedMeal =
    mealType !== "cook" || selectedRecipeId || (meal.name || "").trim();

  return (
    <article
      className={`card meal-card ${isExpanded ? "expanded" : ""}`}
      data-tone={mealTone}
    >
      <button
        className="meal-row-button"
        type="button"
        aria-expanded={isExpanded}
        onClick={toggleExpanded}
      >
        <span className="meal-row-day">{day.slice(0, 3)}</span>

        <span className="meal-row-main">
          <strong className={hasPlannedMeal ? "" : "muted-title"}>
            {mealName}
          </strong>
          {mealLabel && <span>{mealLabel}</span>}
        </span>

        <span className="meal-row-count">{rowBadge}</span>
      </button>

      {isExpanded && (
        <div className="meal-editor">
          <div className="meal-type-tabs" aria-label={`${day} meal type`}>
            <button
              type="button"
              className={mealType === "cook" ? "active" : ""}
              onClick={() => changeMealType("cook")}
            >
              Cook
            </button>

            <button
              type="button"
              className={mealType === "repeat" ? "active" : ""}
              onClick={() => changeMealType("repeat")}
            >
              Same as
            </button>

            <button
              type="button"
              className={mealType === "takeaway" ? "active" : ""}
              onClick={() => changeMealType("takeaway")}
            >
              Takeaway
            </button>

            <button
              type="button"
              className={mealType === "eating-out" ? "active" : ""}
              onClick={() => changeMealType("eating-out")}
            >
              Eating out
            </button>
          </div>

          {mealType === "cook" && (
            <>
              <label className="field-stack">
                <span>Meal</span>

                <select
                  value={selectedRecipeId}
                  onChange={(event) => selectRecipe(event.target.value)}
                >
                  <option value="">Custom meal</option>
                  {recipeGroups.map((group) => (
                    <optgroup key={group.category} label={group.category}>
                      {group.recipes.map((recipe) => (
                        <option key={recipe.id} value={recipe.id}>
                          {recipe.name}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </label>

              {!selectedRecipeId && (
                <input
                  type="text"
                  placeholder="Enter custom meal..."
                  value={meal.name}
                  onChange={(event) =>
                    updateMeal(day, {
                      ...meal,
                      mealType: "cook",
                      name: event.target.value,
                    })
                  }
                />
              )}

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

              <details className="meal-details">
                <summary>
                  Extra ingredients ({manualIngredients.length})
                </summary>

                <div className="add-item-row">
                  <input
                    type="text"
                    placeholder={
                      linkedRecipe ? "Add extra ingredient..." : "Add ingredient..."
                    }
                    value={newIngredient}
                    onChange={(event) =>
                      setNewIngredient(event.target.value)
                    }
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        addIngredient();
                      }
                    }}
                  />

                  <button type="button" onClick={addIngredient}>
                    Add
                  </button>
                </div>

                {manualIngredients.length > 0 && (
                  <ul className="ingredient-list">
                    {manualIngredients.map((ingredient, index) => (
                      <li
                        className="ingredient-row"
                        key={index}
                      >
                        <span>{ingredient}</span>

                        <button
                          type="button"
                          className="delete-button"
                          onClick={() =>
                            deleteIngredient(index)
                          }
                        >
                          Delete
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </details>
            </>
          )}

          {mealType === "repeat" && (
            <label className="field-stack">
              <span>Use the same meal as</span>

              <select
                value={meal.repeatFromDay || ""}
                onChange={(event) => selectRepeatFromDay(event.target.value)}
              >
                <option value="">Choose a night...</option>
                {repeatDayOptions.map((optionDay) => (
                  <option key={optionDay} value={optionDay}>
                    {optionDay}
                  </option>
                ))}
              </select>
            </label>
          )}

          {(mealType === "takeaway" || mealType === "eating-out") && (
            <p className="meal-note">
              {mealType === "takeaway"
                ? "Marked as takeaway. No ingredients will be added to the shopping list."
                : "Marked as eating out. No ingredients will be added to the shopping list."}
            </p>
          )}
        </div>
      )}
    </article>
  );
}

export default MealCard;
