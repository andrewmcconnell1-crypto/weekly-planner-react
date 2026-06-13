import { useState } from "react";
import {
  CalendarPlus,
  ChevronDown,
  ChevronUp,
  NotebookText,
  Repeat2,
  ShoppingBag,
  UtensilsCrossed,
} from "lucide-react";

// The hero "what's for dinner tonight" card at the top of Home. Reads today's
// meal from the current week's plan and adapts to its type: a cooked recipe
// (with the recipe inline), leftovers to reheat, takeaway / eating out, or an
// empty nudge to plan.
function TonightCard({
  dayName,
  dateLabel,
  summary,
  coversNights = 1,
  leftoverDaysLabel,
  onOpenPlan,
}) {
  const [recipeOpen, setRecipeOpen] = useState(false);

  const mealType = summary.meal?.mealType || "cook";
  const linkedRecipe = summary.linkedRecipe;
  const ingredients = summary.ingredients || [];
  const method = linkedRecipe?.method || "";
  const hasRecipeDetail = ingredients.length > 0 || Boolean(method);

  let icon = <UtensilsCrossed size={18} aria-hidden="true" />;
  let dish = summary.name;
  let sub = summary.label;
  let note = "";

  if (!summary.hasMeal) {
    icon = <CalendarPlus size={18} aria-hidden="true" />;
    dish = "No dinner planned";
    sub = `Plan ${dayName}'s meal so you know what's for dinner.`;
  } else if (mealType === "repeat") {
    icon = <Repeat2 size={18} aria-hidden="true" />;
    note = "Just reheat — no cooking needed tonight.";
  } else if (mealType === "takeaway") {
    icon = <ShoppingBag size={18} aria-hidden="true" />;
    dish = "Takeaway";
    sub = "No cooking tonight.";
  } else if (mealType === "eating-out") {
    icon = <UtensilsCrossed size={18} aria-hidden="true" />;
    dish = "Eating out";
    sub = "No cooking tonight.";
  } else if (coversNights > 1) {
    note = `Cook once tonight — covers ${leftoverDaysLabel}. Make extra.`;
  }

  return (
    <section className="tonight-card" aria-label={`Tonight, ${dayName}`}>
      <p className="tonight-kicker">
        {icon}
        <span>Tonight · {dateLabel}</span>
      </p>

      <strong className="tonight-dish">{dish}</strong>

      {sub && <p className="tonight-sub">{sub}</p>}

      {note && <p className="tonight-note">{note}</p>}

      {mealType === "cook" && summary.hasMeal && hasRecipeDetail && (
        <div className="tonight-recipe-block">
          <button
            type="button"
            className="tonight-recipe-toggle"
            aria-expanded={recipeOpen}
            onClick={() => setRecipeOpen((open) => !open)}
          >
            <NotebookText size={16} aria-hidden="true" />
            <span>{recipeOpen ? "Hide recipe" : "View recipe"}</span>
            {recipeOpen ? (
              <ChevronUp size={16} aria-hidden="true" />
            ) : (
              <ChevronDown size={16} aria-hidden="true" />
            )}
          </button>

          {recipeOpen && (
            <div className="tonight-recipe">
              {ingredients.length > 0 && (
                <div className="tonight-recipe-section">
                  <p className="tonight-recipe-label">
                    Ingredients ({ingredients.length})
                  </p>
                  <ul>
                    {ingredients.map((ingredient, index) => (
                      <li key={index}>{ingredient}</li>
                    ))}
                  </ul>
                </div>
              )}

              {method && (
                <div className="tonight-recipe-section">
                  <p className="tonight-recipe-label">Method</p>
                  <p className="tonight-method">{method}</p>
                </div>
              )}

              {linkedRecipe?.sourceUrl && (
                <a
                  className="tonight-source"
                  href={linkedRecipe.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open source recipe
                </a>
              )}
            </div>
          )}
        </div>
      )}

      <button type="button" className="tonight-action" onClick={onOpenPlan}>
        {summary.hasMeal ? "Edit tonight's meal" : "Plan tonight"}
      </button>
    </section>
  );
}

export default TonightCard;
