import { ChevronRight } from "lucide-react";

import {
  getRecipeTone,
  recipeSourceKind,
  recipeSourceLabel,
} from "../utils/recipeUtils";
import { recipeImagery } from "../utils/recipeImagery";
import RecipeThumb from "./RecipeThumb";

// One recipe row, shared by the Recipes manager and the meal editor's picker so
// they look identical. `active` highlights the currently-selected recipe.
// `coverage` (optional, from rankRecipesByCoverage) adds a Ready / "N short"
// badge so the picker can sort by what the kitchen can already cook.
function RecipeCard({ recipe, active = false, onClick, coverage }) {
  return (
    <button
      type="button"
      className={`recipe-row ${active ? "active" : ""}`}
      data-tone={getRecipeTone(recipe.category)}
      onClick={onClick}
    >
      <span className="recipe-row-inner">
        <RecipeThumb imagery={recipeImagery(recipe)} size="sm" />

        <span className="recipe-row-main">
          <strong>{recipe.name}</strong>
          <span className="recipe-row-meta">
            <span className="recipe-row-tag">
              {recipe.category || "Uncategorised"}
            </span>
            {recipe.serves ? (
              <span className="recipe-row-serves">Serves {recipe.serves}</span>
            ) : null}
            <span
              className="recipe-source"
              data-source={recipeSourceKind(recipe)}
            >
              {recipeSourceLabel(recipe)}
            </span>
            {coverage && coverage.tier !== "more" && (
              <span className={`cookable-badge cookable-${coverage.tier}`}>
                {coverage.tier === "ready"
                  ? "Ready"
                  : `${coverage.missing.length} short`}
              </span>
            )}
          </span>
        </span>

        <ChevronRight
          className="recipe-row-chevron"
          size={18}
          aria-hidden="true"
        />
      </span>
    </button>
  );
}

export default RecipeCard;
