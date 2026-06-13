import { Plus } from "lucide-react";

// The tappable summary row for one day. Tapping it opens the meal editor sheet.
function MealCard({
  day,
  meal,
  displayName,
  mealLabel,
  mealTone,
  ingredientCount,
  coversNights = 1,
  hasMeal,
  onOpen,
}) {
  const mealType = meal.mealType || "cook";
  const visibleIngredientCount = ingredientCount ?? 0;
  const feedsLeftovers = mealType === "cook" && coversNights > 1;
  const rowBadge =
    mealType === "cook"
      ? feedsLeftovers
        ? `${coversNights} nights`
        : `${visibleIngredientCount} ingredient${
            visibleIngredientCount === 1 ? "" : "s"
          }`
      : mealType === "repeat"
        ? "Leftovers"
        : mealType === "takeaway"
          ? "Takeaway"
          : "Out";
  const secondaryLabel = feedsLeftovers
    ? `${mealLabel} · cook once, eat ${coversNights} nights`
    : mealLabel;
  const mealName = displayName || (meal.name || "").trim();

  // Unplanned day: a single clear "needs action" prompt, no redundant labels.
  if (!hasMeal) {
    return (
      <article className="card meal-card meal-card-empty" data-tone={mealTone}>
        <button className="meal-row-button" type="button" onClick={onOpen}>
          <span className="meal-row-day">{day.slice(0, 3)}</span>

          <span className="meal-row-main">
            <strong className="meal-row-add">Add a meal</strong>
          </span>

          <span className="meal-row-addicon" aria-hidden="true">
            <Plus size={18} strokeWidth={2.5} />
          </span>
        </button>
      </article>
    );
  }

  return (
    <article className="card meal-card" data-tone={mealTone}>
      <button className="meal-row-button" type="button" onClick={onOpen}>
        <span className="meal-row-day">{day.slice(0, 3)}</span>

        <span className="meal-row-main">
          <strong>{mealName}</strong>
          {secondaryLabel && <span>{secondaryLabel}</span>}
        </span>

        <span className="meal-row-count">{rowBadge}</span>

        <span className="meal-row-chevron">›</span>
      </button>
    </article>
  );
}

export default MealCard;
