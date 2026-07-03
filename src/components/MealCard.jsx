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
// A left "calendar rail" so each row leads with its day (like a calendar),
// showing the day abbreviation over the date number when a date is available.
export function DayRail({ day, date, isToday = false }) {
  return (
    <span className={`meal-daycol ${isToday ? "meal-daycol-today" : ""}`}>
      <span className="meal-daycol-dow" aria-hidden="true">
        {day.slice(0, 3).toUpperCase()}
      </span>
      {date && (
        <span className="meal-daycol-dom" aria-hidden="true">
          {date.getDate()}
        </span>
      )}
      <span className="visually-hidden">{day}</span>
    </span>
  );
}

function MealCard({
  day,
  date,
  meal,
  displayName,
  mealLabel,
  mealTone,
  hasMeal,
  isToday = false,
  isDragOver = false,
  onOpen,
}) {
  const mealType = meal.mealType || "cook";
  const batches = Math.max(1, Math.round(Number(meal.batches) || 1));
  const mealName = displayName || (meal.name || "").trim();

  // Unplanned day: an inviting "add" tile, not a faded version of a meal card.
  if (!hasMeal) {
    return (
      <article
        className={`meal-card meal-card-empty ${isToday ? "meal-card-today" : ""} ${
          isDragOver ? "meal-drag-over" : ""
        }`}
        data-tone={mealTone}
        data-drag-day={day}
      >
        <button className="meal-row-button" type="button" onClick={onOpen}>
          <DayRail day={day} date={date} isToday={isToday} />

          <span className="meal-type-badge">
            <Plus size={20} aria-hidden="true" />
          </span>

          <span className="meal-row-main">
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
      className={`card meal-card meal-card-${typeKey} ${
        isToday ? "meal-card-today" : ""
      } ${isDragOver ? "meal-drag-over" : ""}`}
      data-tone={mealTone}
      data-drag-day={day}
    >
      <button className="meal-row-button" type="button" onClick={onOpen}>
        <DayRail day={day} date={date} isToday={isToday} />

        <span className="meal-type-badge">
          <TypeIcon size={20} aria-hidden="true" />
        </span>

        <span className="meal-row-main">
          <strong>{mealName}</strong>
          <span className="meal-row-sub">{subText}</span>
        </span>

        <ChevronRight className="meal-row-chevron" size={18} aria-hidden="true" />
      </button>
    </article>
  );
}

export default MealCard;
