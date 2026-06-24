import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  ExternalLink,
  NotebookText,
} from "lucide-react";

import { parseMethodSteps } from "../utils/recipeUtils";

// Collapsible "View recipe" disclosure shared by the Home hero (TonightCard)
// and the meal editor's "Selected" block, so both render a recipe's ingredients
// and method identically. `variant` switches the colour theme between the dark
// hero ("hero") and the light editor sheet ("sheet"). Renders nothing when the
// recipe carries no detail to show.
function RecipeDetail({
  ingredients = [],
  method = "",
  sourceUrl = "",
  variant = "sheet",
}) {
  const [open, setOpen] = useState(false);

  const hasDetail = ingredients.length > 0 || Boolean(method);
  if (!hasDetail) return null;

  const methodSteps = parseMethodSteps(method);

  return (
    <div className={`recipe-detail recipe-detail-${variant}`}>
      <button
        type="button"
        className="recipe-detail-toggle"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <NotebookText size={16} aria-hidden="true" />
        <span>{open ? "Hide recipe" : "View recipe"}</span>
        {open ? (
          <ChevronUp size={16} aria-hidden="true" />
        ) : (
          <ChevronDown size={16} aria-hidden="true" />
        )}
      </button>

      {open && (
        <div className="recipe-detail-body">
          {ingredients.length > 0 && (
            <div className="recipe-detail-section">
              <p className="recipe-detail-label">
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
            <div className="recipe-detail-section">
              <p className="recipe-detail-label">Method</p>
              {methodSteps.length > 1 ? (
                <ol className="recipe-detail-steps">
                  {methodSteps.map((step, index) => (
                    <li key={index}>{step}</li>
                  ))}
                </ol>
              ) : (
                <p className="recipe-detail-method">{method}</p>
              )}
            </div>
          )}

          {sourceUrl && (
            <a
              className="recipe-detail-source"
              href={sourceUrl}
              target="_blank"
              rel="noreferrer"
            >
              <ExternalLink size={14} aria-hidden="true" />
              Open source recipe
            </a>
          )}
        </div>
      )}
    </div>
  );
}

export default RecipeDetail;
