import { ChevronRight, CookingPot, CornerDownRight } from "lucide-react";

import { DayRail } from "./MealCard";
import MealReorderHandle from "./MealReorderHandle";

// A cook day plus the leftover (repeat) days that follow it, rendered as one
// merged card: the cook day is emphasised on top, the leftover nights hang
// beneath it as recessed, tappable sub-rows.
function MealLeftoverCluster({
  leadDay,
  leadSummary,
  repeatDays,
  onOpenDay,
  todayDayName,
  getDate,
  dragOverDay = null,
  reorder = null,
}) {
  const coversNights = repeatDays.length + 1;
  const leadName = leadSummary.name || "No meal planned";
  const batches = Math.max(1, Math.round(Number(leadSummary.meal?.batches) || 1));

  return (
    <article
      className={`card meal-card meal-card-cook meal-cluster ${
        leadDay === todayDayName ? "meal-card-today" : ""
      } ${dragOverDay === leadDay ? "meal-drag-over" : ""} ${
        reorder?.grabbedDay === leadDay ? "meal-reorder-active" : ""
      }`}
      data-tone={leadSummary.tone}
      data-drag-day={leadDay}
    >
      <button
        className="meal-row-button"
        type="button"
        onClick={() => onOpenDay(leadDay)}
      >
        <DayRail
          day={leadDay}
          date={getDate?.(leadDay)}
          isToday={leadDay === todayDayName}
        />

        <span className="meal-type-badge">
          <CookingPot size={20} aria-hidden="true" />
        </span>

        <span className="meal-row-main">
          <strong>{leadName}</strong>
          <span className="meal-row-sub">
            Cook once · eat {coversNights} nights
            {batches > 1 ? ` · ×${batches}` : ""}
          </span>
        </span>

        <ChevronRight className="meal-row-chevron" size={18} aria-hidden="true" />
      </button>

      <MealReorderHandle day={leadDay} name={leadSummary.name} reorder={reorder} />

      <div className="meal-cluster-repeats">
        {repeatDays.map((repeatDay) => (
          <button
            key={repeatDay}
            className={`meal-cluster-repeat ${
              dragOverDay === repeatDay ? "meal-drag-over" : ""
            }`}
            type="button"
            data-drag-day={repeatDay}
            onClick={() => onOpenDay(repeatDay)}
          >
            <DayRail
              day={repeatDay}
              date={getDate?.(repeatDay)}
              isToday={repeatDay === todayDayName}
            />

            <span className="meal-cluster-repeat-label">
              <CornerDownRight size={14} aria-hidden="true" />
              Leftovers
            </span>

            <ChevronRight className="meal-row-chevron" size={18} aria-hidden="true" />
          </button>
        ))}
      </div>
    </article>
  );
}

export default MealLeftoverCluster;
