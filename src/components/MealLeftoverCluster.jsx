import { ChevronRight, CookingPot, CornerDownRight } from "lucide-react";

// A cook day plus the leftover (repeat) days that follow it, rendered as one
// merged card: the cook day is emphasised on top, the leftover nights hang
// beneath it as recessed, tappable sub-rows.
function MealLeftoverCluster({
  leadDay,
  leadSummary,
  repeatDays,
  onOpenDay,
  todayDayName,
}) {
  const coversNights = repeatDays.length + 1;
  const leadName = leadSummary.name || "No meal planned";
  const batches = Math.max(1, Math.round(Number(leadSummary.meal?.batches) || 1));

  return (
    <article
      className={`card meal-card meal-card-cook meal-cluster ${
        leadDay === todayDayName ? "meal-card-today" : ""
      }`}
      data-tone={leadSummary.tone}
    >
      <button
        className="meal-row-button"
        type="button"
        onClick={() => onOpenDay(leadDay)}
      >
        <span className="meal-type-badge">
          <CookingPot size={20} aria-hidden="true" />
        </span>

        <span className="meal-row-main">
          <span className="meal-row-day">
            {leadDay}
            {leadDay === todayDayName && (
              <span className="meal-today-pill">Today</span>
            )}
          </span>
          <strong>{leadName}</strong>
          <span className="meal-row-sub">
            Cook once · eat {coversNights} nights
            {batches > 1 ? ` · ×${batches}` : ""}
          </span>
        </span>

        <ChevronRight className="meal-row-chevron" size={18} aria-hidden="true" />
      </button>

      <div className="meal-cluster-repeats">
        {repeatDays.map((repeatDay) => (
          <button
            key={repeatDay}
            className="meal-cluster-repeat"
            type="button"
            onClick={() => onOpenDay(repeatDay)}
          >
            <span className="meal-cluster-repeat-day">
              {repeatDay}
              {repeatDay === todayDayName && (
                <span className="meal-today-pill">Today</span>
              )}
            </span>

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
