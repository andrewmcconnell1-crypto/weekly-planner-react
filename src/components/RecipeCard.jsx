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
function RecipeCard({ recipe, active = false, onClick }) {
  return (
    <button
      type="button"
      className={`recipe-row ${active ? "active" : ""}`}
      data-tone={getRecipeTone(recipe.category)}
      onClick={onClick}
    >
      <span className="recipe-row-inner">
        <RecipeThumb imagery={recipeImagery(recipe)} name={recipe.name} size="sm" />

        <span className="recipe-row-main">
          <strong>{recipe.name}</strong>
          <span className="recipe-row-meta">
            <span className="recipe-row-tag">
              {recipe.category || "Uncategorised"}
            </span>
            {recipe.serves ? (
              <span className="recipe-row-serves">Serves {recipe.serves}</span>
            ) : null}
          </span>
        </span>

        <span className="recipe-source" data-source={recipeSourceKind(recipe)}>
          {recipeSourceLabel(recipe)}
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
