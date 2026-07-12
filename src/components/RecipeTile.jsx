import { CalendarPlus, Clock, Heart } from "lucide-react";

import { getRecipeTone, recipeSourceLabel } from "../utils/recipeUtils";
import { recipeImagery } from "../utils/recipeImagery";
import RecipeThumb from "./RecipeThumb";

// A recipe as a grid tile: a tall gradient+glyph thumb with a favourite heart
// tucked in the corner, then the name and one quiet meta line. Tapping the
// thumb/name opens the detail sheet; the heart toggles independently.
// `coverage` (from rankRecipesByCoverage) adds a Ready / "N short" badge in the
// "For you" view.
function RecipeTile({
  recipe,
  isFavourite,
  onToggleFavourite,
  onOpen,
  onPlan,
  coverage,
}) {
  const meta = [recipe.category, recipeSourceLabel(recipe)]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="recipe-tile" data-tone={getRecipeTone(recipe.category)}>
      <button
        type="button"
        className="recipe-tile-open"
        onClick={onOpen}
        aria-label={`View ${recipe.name}`}
      >
        <span className="recipe-tile-thumb">
          <RecipeThumb imagery={recipeImagery(recipe)} size="tile" />

          {recipe.timeMins ? (
            <span className="recipe-tile-time">
              <Clock size={12} aria-hidden="true" />
              {recipe.timeMins} min
            </span>
          ) : null}

          {coverage && coverage.tier !== "more" && (
            <span className={`cookable-badge cookable-${coverage.tier}`}>
              {coverage.tier === "ready"
                ? "Ready"
                : `${coverage.missing.length} short`}
            </span>
          )}
        </span>

        <span className="recipe-tile-body">
          <strong className="recipe-tile-name">{recipe.name}</strong>
          <span className="recipe-tile-meta">{meta}</span>
        </span>
      </button>

      {onPlan && (
        <button
          type="button"
          className="recipe-tile-plan"
          onClick={() => onPlan(recipe)}
        >
          <CalendarPlus size={15} aria-hidden="true" />
          Add to a night
        </button>
      )}

      <button
        type="button"
        className={`recipe-tile-fav ${isFavourite ? "is-fav" : ""}`}
        aria-pressed={isFavourite}
        aria-label={
          isFavourite
            ? `Remove ${recipe.name} from favourites`
            : `Add ${recipe.name} to favourites`
        }
        onClick={() => onToggleFavourite(recipe.id)}
      >
        <Heart
          size={17}
          fill={isFavourite ? "currentColor" : "none"}
          aria-hidden="true"
        />
      </button>
    </div>
  );
}

export default RecipeTile;
