import { CornerDownRight } from "lucide-react";

// A cook day plus the leftover (repeat) days that follow it, rendered as one
// merged card: the cook day is emphasised on top, the leftover nights hang
// beneath it as recessed, tappable sub-rows.
function MealLeftoverCluster({ leadDay, leadSummary, repeatDays, onOpenDay }) {
  const coversNights = repeatDays.length + 1;
  const leadName = leadSummary.name || "No meal planned";
  const batches = Math.max(1, Math.round(Number(leadSummary.meal?.batches) || 1));

  return (
    <article
      className="card meal-card meal-card-cook meal-cluster"
      data-tone={leadSummary.tone}
    >
      <button
        className="meal-row-button meal-row-button-nobadge"
        type="button"
        onClick={() => onOpenDay(leadDay)}
      >
        <span className="meal-row-day">{leadDay.slice(0, 3)}</span>

        <span className="meal-row-main">
          <strong>{leadName}</strong>
          <span>
            {leadSummary.label} · cook once, eat {coversNights} nights
            {batches > 1 ? ` · ×${batches} batch` : ""}
          </span>
        </span>

        <span className="meal-row-chevron">›</span>
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
              {repeatDay.slice(0, 3)}
            </span>

            <span className="meal-cluster-repeat-label">
              <CornerDownRight size={14} aria-hidden="true" />
              Leftovers
            </span>

            <span className="meal-row-chevron">›</span>
          </button>
        ))}
      </div>
    </article>
  );
}

export default MealLeftoverCluster;
