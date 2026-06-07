import { useState } from "react";

function MealCard({
  day,
  meal,
  recipes,
  linkedRecipe,
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

  function addIngredient() {
    const cleanedIngredient = newIngredient.trim();

    if (cleanedIngredient === "") return;

    updateMeal(day, {
      ...meal,
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
        recipeId: "",
      });
      return;
    }

    updateMeal(day, {
      ...meal,
      name: selectedRecipe.name,
      recipeId: selectedRecipe.id,
    });
  }

  const mealName = (meal.name || "").trim() || "No meal planned";
  const visibleIngredientCount =
    ingredientCount ?? manualIngredients.length;
  const ingredientLabel = `${visibleIngredientCount} ingredient${
    visibleIngredientCount === 1 ? "" : "s"
  }`;
  const selectedRecipeId = meal.recipeId || linkedRecipe?.id || "";

  return (
    <article className={`card meal-card ${isExpanded ? "expanded" : ""}`}>
      <button
        className="meal-row-button"
        type="button"
        aria-expanded={isExpanded}
        onClick={toggleExpanded}
      >
        <span className="meal-row-day">{day}</span>

        <span className="meal-row-main">
          <strong className={(meal.name || "").trim() ? "" : "muted-title"}>
            {mealName}
          </strong>
        </span>

        <span className="meal-row-count">{ingredientLabel}</span>
      </button>

      {isExpanded && (
        <div className="meal-editor">
          <label className="field-stack">
            <span>Saved recipe</span>

            <select
              value={selectedRecipeId}
              onChange={(event) => selectRecipe(event.target.value)}
            >
              <option value="">Custom meal</option>
              {recipes.map((recipe) => (
                <option key={recipe.id} value={recipe.id}>
                  {recipe.name}
                </option>
              ))}
            </select>
          </label>

          <input
            type="text"
            placeholder="Enter meal..."
            value={meal.name}
            onChange={(event) =>
              updateMeal(day, {
                ...meal,
                name: event.target.value,
              })
            }
          />

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
                <ul className="ingredient-list recipe-ingredient-list">
                  {linkedRecipeIngredients.map((ingredient, index) => (
                    <li className="ingredient-row read-only-row" key={index}>
                      <span>{ingredient}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

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
              {linkedRecipe && (
                <li className="ingredient-section-label">Extra ingredients</li>
              )}

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
        </div>
      )}
    </article>
  );
}

export default MealCard;
