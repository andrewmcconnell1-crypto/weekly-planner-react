import {
  ChevronRight,
  CookingPot,
  Plus,
  Repeat2,
  ShoppingBag,
  UtensilsCrossed,
} from "lucide-react";

// Each meal type gets its own icon + label so a cook night reads differently
// from a takeaway, an eating-out night, or leftovers — at a glance.
const TYPE_META = {
  cook: { icon: CookingPot, label: "Cooking" },
  leftovers: { icon: Repeat2, label: "Leftovers" },
  takeaway: { icon: ShoppingBag, label: "Takeaway" },
  "eating-out": { icon: UtensilsCrossed, label: "Eating out" },
};

// The tappable summary card for one day. Tapping it opens the meal editor.
function MealCard({ day, meal, displayName, mealLabel, mealTone, hasMeal, onOpen }) {
  const mealType = meal.mealType || "cook";
  const batches = Math.max(1, Math.round(Number(meal.batches) || 1));
  const mealName = displayName || (meal.name || "").trim();

  // Unplanned day: an inviting "add" tile, not a faded version of a meal card.
  if (!hasMeal) {
    return (
      <article className="meal-card meal-card-empty" data-tone={mealTone}>
        <button className="meal-row-button" type="button" onClick={onOpen}>
          <span className="meal-type-badge">
            <Plus size={20} aria-hidden="true" />
          </span>

          <span className="meal-row-main">
            <span className="meal-row-day">{day}</span>
            <strong className="meal-row-add">Add a meal</strong>
          </span>
        </button>
      </article>
    );
  }

  const typeKey =
    mealType === "takeaway"
      ? "takeaway"
      : mealType === "eating-out"
        ? "eating-out"
        : mealType === "repeat"
          ? "leftovers"
          : "cook";
  const TypeIcon = TYPE_META[typeKey].icon;
  const sub = mealLabel || TYPE_META[typeKey].label;
  const subText =
    typeKey === "cook" && batches > 1 ? `${sub} · ×${batches}` : sub;

  return (
    <article
      className={`card meal-card meal-card-${typeKey}`}
      data-tone={mealTone}
    >
      <button className="meal-row-button" type="button" onClick={onOpen}>
        <span className="meal-type-badge">
          <TypeIcon size={20} aria-hidden="true" />
        </span>

        <span className="meal-row-main">
          <span className="meal-row-day">{day}</span>
          <strong>{mealName}</strong>
          <span className="meal-row-sub">{subText}</span>
        </span>

        <ChevronRight className="meal-row-chevron" size={18} aria-hidden="true" />
      </button>
    </article>
  );
}

export default MealCard;
