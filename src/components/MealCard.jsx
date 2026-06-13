import { Plus } from "lucide-react";

// The tappable summary row for one day. Tapping it opens the meal editor sheet.
function MealCard({
  day,
  meal,
  displayName,
  mealLabel,
  mealTone,
  hasMeal,
  onOpen,
}) {
  const mealType = meal.mealType || "cook";
  const isCook = mealType === "cook";
  const batches = Math.max(1, Math.round(Number(meal.batches) || 1));
  // Cook days carry no badge unless cooked as a multi batch; other types get a
  // short status badge.
  const rowBadge =
    mealType === "repeat"
      ? "Leftovers"
      : mealType === "takeaway"
        ? "Takeaway"
        : mealType === "eating-out"
          ? "Out"
          : isCook && batches > 1
            ? `×${batches}`
            : "";
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
    <article
      className={`card meal-card ${isCook ? "meal-card-cook" : ""}`}
      data-tone={mealTone}
    >
      <button
        className={`meal-row-button ${rowBadge ? "" : "meal-row-button-nobadge"}`}
        type="button"
        onClick={onOpen}
      >
        <span className="meal-row-day">{day.slice(0, 3)}</span>

        <span className="meal-row-main">
          <strong>{mealName}</strong>
          {mealLabel && <span>{mealLabel}</span>}
        </span>

        {rowBadge && <span className="meal-row-count">{rowBadge}</span>}

        <span className="meal-row-chevron">›</span>
      </button>
    </article>
  );
}

export default MealCard;
