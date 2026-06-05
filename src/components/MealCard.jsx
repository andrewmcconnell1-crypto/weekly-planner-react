import { useState } from "react";

function MealCard({ day, meal, updateMeal, isExpanded, toggleExpanded }) {
  const [newIngredient, setNewIngredient] = useState("");

  function addIngredient() {
    const cleanedIngredient = newIngredient.trim();

    if (cleanedIngredient === "") return;

    updateMeal(day, {
      ...meal,
      ingredients: [
        ...meal.ingredients,
        cleanedIngredient,
      ],
    });

    setNewIngredient("");
  }

  function deleteIngredient(indexToDelete) {
    updateMeal(day, {
      ...meal,
      ingredients: meal.ingredients.filter(
        (_, index) => index !== indexToDelete
      ),
    });
  }

  const mealName = meal.name.trim() || "No meal planned";
  const ingredientCount = meal.ingredients.length;
  const ingredientLabel = `${ingredientCount} ingredient${
    ingredientCount === 1 ? "" : "s"
  }`;

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
          <strong className={meal.name.trim() ? "" : "muted-title"}>
            {mealName}
          </strong>
        </span>

        <span className="meal-row-count">{ingredientLabel}</span>
      </button>

      {isExpanded && (
        <div className="meal-editor">
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

          <div className="add-item-row">
            <input
              type="text"
              placeholder="Add ingredient..."
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

            <button onClick={addIngredient}>
              Add
            </button>
          </div>

          {meal.ingredients.length > 0 && (
            <ul className="ingredient-list">
              {meal.ingredients.map((ingredient, index) => (
                <li
                  className="ingredient-row"
                  key={index}
                >
                  <span>{ingredient}</span>

                  <button
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
