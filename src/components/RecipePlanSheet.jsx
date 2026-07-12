import { useEffect, useRef, useState } from "react";
import { Check, X } from "lucide-react";

import { useDialogFocus } from "../hooks/useDialogFocus";
import { days } from "../utils/mealUtils";
import { formatDate } from "../utils/dateUtils";

// A night is already spoken for if it has a recipe, a named meal, or is a
// leftovers repeat — mirror the Baskets panel so the two planners agree.
function isTakenNight(meal) {
  if (!meal) return false;
  if (meal.mealType === "repeat") return true;
  return Boolean(meal.recipeId || meal.name);
}

function dayDate(weekStart, index) {
  const date = new Date(weekStart);
  date.setDate(weekStart.getDate() + index);
  return date;
}

// Compact bottom sheet for dropping a recipe onto a night. Opened from a recipe
// tile's "Add to a night" — lists this week and next as day buttons; picking one
// plans the recipe there and closes. Taken nights stay pickable (they replace),
// flagged so it's a deliberate swap.
function RecipePlanSheet({ recipe, planWeeks, onPlan, onClose }) {
  const [closing, setClosing] = useState(false);
  const closeTimerRef = useRef(null);
  const dialogRef = useRef(null);

  useDialogFocus(dialogRef);

  function requestClose() {
    if (closeTimerRef.current) return;
    setClosing(true);
    closeTimerRef.current = window.setTimeout(onClose, 220);
  }

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKey(event) {
      if (event.key === "Escape") {
        event.stopImmediatePropagation();
        requestClose();
      }
    }

    window.addEventListener("keydown", handleKey, true);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKey, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => () => window.clearTimeout(closeTimerRef.current), []);

  function pick(weekKey, day) {
    onPlan(weekKey, day, recipe);
    requestClose();
  }

  return (
    <div
      className={`sheet-backdrop ${closing ? "closing" : ""}`}
      role="presentation"
      onClick={requestClose}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        className={`sheet ${closing ? "closing" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label={`Add ${recipe.name} to a night`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="sheet-header">
          <div className="sheet-title">
            <strong>Add to a night</strong>
            <span>{recipe.name}</span>
          </div>

          <button
            type="button"
            className="sheet-close"
            aria-label="Close"
            onClick={requestClose}
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        <div className="sheet-body recipe-plan-sheet-body">
          {planWeeks.map((week) => (
            <div key={week.key} className="recipe-plan-week">
              <p className="section-kicker">
                {week.label} · {formatDate(week.start)}
              </p>

              <div className="recipe-plan-days">
                {days.map((day, index) => {
                  const taken = isTakenNight(week.meals?.[day]);
                  return (
                    <button
                      key={day}
                      type="button"
                      className={`recipe-plan-day ${taken ? "is-taken" : ""}`}
                      onClick={() => pick(week.key, day)}
                    >
                      <span className="recipe-plan-day-name">{day}</span>
                      <span className="recipe-plan-day-date">
                        {formatDate(dayDate(week.start, index))}
                      </span>
                      {taken && (
                        <span className="recipe-plan-day-flag">Planned</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="sheet-footer recipe-plan-sheet-footer">
          <p className="small-text">
            <Check size={13} aria-hidden="true" /> Cook-once nights fill their
            leftovers automatically.
          </p>
        </div>
      </div>
    </div>
  );
}

export default RecipePlanSheet;
