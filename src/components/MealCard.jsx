// The tappable summary row for one day. Tapping it opens the meal editor sheet.
function MealCard({
  day,
  meal,
  displayName,
  mealLabel,
  mealTone,
  ingredientCount,
  hasMeal,
  isToday,
  onOpen,
}) {
  const mealType = meal.mealType || "cook";
  const visibleIngredientCount = ingredientCount ?? 0;
  const rowBadge = hasMeal
    ? mealType === "cook"
      ? `${visibleIngredientCount} ingredient${
          visibleIngredientCount === 1 ? "" : "s"
        }`
      : mealType === "repeat"
        ? "Repeat"
        : mealType === "takeaway"
          ? "Takeaway"
          : "Out"
    : null;
  const mealName = displayName || (meal.name || "").trim();

  return (
    <article
      className={`card meal-card${isToday ? " meal-card-today" : ""}`}
      data-tone={mealTone}
    >
      <button
        className="meal-row-button"
        type="button"
        onClick={onOpen}
      >
        <span className="meal-row-day">
          {isToday ? <span className="today-label">Today</span> : day.slice(0, 3)}
        </span>

        <span className="meal-row-main">
          {hasMeal ? (
            <>
              <strong>{mealName}</strong>
              {mealLabel && <span>{mealLabel}</span>}
            </>
          ) : (
            <span className="meal-row-empty">Add meal</span>
          )}
        </span>

        <span className="meal-row-count">{rowBadge}</span>

        <span className="meal-row-chevron">›</span>
      </button>
    </article>
  );
}

export default MealCard;
