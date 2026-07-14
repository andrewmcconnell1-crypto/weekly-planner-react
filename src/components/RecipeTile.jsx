import { CalendarPlus, Clock, CookingPot, Heart, Sparkles } from "lucide-react";

import { recipeProvenance } from "../utils/recipeUtils";
import { recipeImagery } from "../utils/recipeImagery";
import DishGlyph from "./DishGlyph";
import StarRating from "./StarRating";

// A recipe as a typographic "cover": the name is the hero, set in the display
// serif over its category-toned gradient, with the dish glyph dropped back to a
// faint watermark for texture (so a run of same-category tiles reads as a set,
// not a wall of identical icons). A full-cover button handles opening; the
// heart and plan buttons sit on top. `coverage` adds a Ready / "N short" badge.
function RecipeTile({
  recipe,
  isFavourite,
  onToggleFavourite,
  onOpen,
  onPlan,
  coverage,
  rating = 0,
  cookCount = 0,
}) {
  const imagery = recipeImagery(recipe);
  const provenance = recipeProvenance(recipe);

  return (
    <div
      className="recipe-tile"
      data-tone={imagery.tone}
      style={{ background: imagery.gradient }}
    >
      {/* Stretched primary action — covers the whole tile, sits under the
          overlaid controls so the name/facts can pass taps through to it. */}
      <button
        type="button"
        className="recipe-tile-open"
        onClick={onOpen}
        aria-label={`View ${recipe.name}`}
      />

      <span className="recipe-tile-glyph" aria-hidden="true">
        <DishGlyph glyph={imagery.glyph} />
      </span>

      <span className="recipe-tile-scrim" aria-hidden="true" />

      <div className="recipe-tile-content">
        {rating > 0 && (
          <span className="recipe-tile-rating">
            <StarRating
              value={rating}
              readOnly
              size={13}
              label={`You rated this ${rating} out of 5`}
            />
          </span>
        )}

        <span
          className={`recipe-tile-kicker ${
            provenance.original ? "is-original" : ""
          }`}
        >
          {provenance.original && (
            <Sparkles size={11} aria-hidden="true" />
          )}
          {provenance.label}
        </span>

        <strong className="recipe-tile-name">{recipe.name}</strong>

        <span className="recipe-tile-actionrow">
          <span className="recipe-tile-facts">
            {recipe.timeMins ? (
              <span className="recipe-tile-fact">
                <Clock size={12} aria-hidden="true" />
                {recipe.timeMins} min
              </span>
            ) : null}
            {cookCount > 0 ? (
              <span
                className="recipe-tile-fact"
                title={`Cooked ${cookCount} ${
                  cookCount === 1 ? "time" : "times"
                }`}
              >
                <CookingPot size={12} aria-hidden="true" />
                {cookCount}&times;
              </span>
            ) : null}
          </span>

          {onPlan && (
            <button
              type="button"
              className="recipe-tile-plan"
              aria-label={`Add ${recipe.name} to a night`}
              onClick={() => onPlan(recipe)}
            >
              <CalendarPlus size={16} aria-hidden="true" />
            </button>
          )}
        </span>
      </div>

      {coverage && coverage.tier !== "more" && (
        <span
          className={`cookable-badge cookable-${coverage.tier} recipe-tile-badge`}
        >
          {coverage.tier === "ready"
            ? "Ready"
            : `${coverage.missing.length} short`}
        </span>
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
