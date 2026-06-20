import { useMemo, useRef, useState } from "react";
import { Check, RotateCcw, X } from "lucide-react";

import { recipeSourceLabel, recipeTags } from "../utils/recipeUtils";

// Swipe-to-plan: a filtered deck of recipe cards. Swipe right (or "Add") drops
// the recipe onto the next empty night; swipe left (or "Skip") passes. Filters
// narrow the deck by tag. The Skip/Add buttons are the reliable path; the drag
// is an enhancement, so both route through the same commit().
const SWIPE_AT = 90;

function RecipeDiscoverySheet({
  recipes,
  unplannedDays = [],
  initialDay = null,
  plannedRecipeIds = [],
  onAssign,
  onClose,
}) {
  const [selectedTags, setSelectedTags] = useState(() => new Set());
  const [handled, setHandled] = useState(() => new Set());
  const [usedInitial, setUsedInitial] = useState(false);
  const [lastAdded, setLastAdded] = useState(null);
  const [drag, setDrag] = useState({ x: 0, y: 0, active: false });
  const [leaving, setLeaving] = useState(null);
  const [closing, setClosing] = useState(false);
  const start = useRef({ x: 0, y: 0 });
  const closeTimer = useRef(null);
  const commitTimer = useRef(null);

  const plannedSet = useMemo(
    () => new Set(plannedRecipeIds),
    [plannedRecipeIds]
  );

  const deck = useMemo(() => {
    const tags = [...selectedTags];
    return recipes.filter((recipe) => {
      if (handled.has(recipe.id) || plannedSet.has(recipe.id)) return false;
      return tags.every((tag) => (recipe.tags || []).includes(tag));
    });
  }, [recipes, selectedTags, handled, plannedSet]);

  const top = deck[0];
  // When opened from a specific day, fill that day first; then fall back to the
  // week's remaining empty nights in order.
  const nextDay =
    !usedInitial && initialDay ? initialDay : unplannedDays[0] || null;
  const weekFull = !nextDay;

  function requestClose() {
    if (closeTimer.current) return;
    setClosing(true);
    closeTimer.current = window.setTimeout(onClose, 220);
  }

  function toggleTag(tag) {
    setSelectedTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  }

  function apply(direction, recipe) {
    if (direction === "right" && nextDay && recipe) {
      onAssign(nextDay, recipe);
      setLastAdded({ name: recipe.name, day: nextDay });
      if (nextDay === initialDay) setUsedInitial(true);
    }
    if (recipe) {
      setHandled((prev) => new Set(prev).add(recipe.id));
    }
  }

  // Animate the top card off-screen, then advance the deck.
  function commit(direction) {
    if (leaving || !top) return;
    if (direction === "right" && weekFull) {
      setDrag({ x: 0, y: 0, active: false }); // nothing to fill — snap back
      return;
    }
    const recipe = top;
    setLeaving(direction);
    commitTimer.current = window.setTimeout(() => {
      setLeaving(null);
      setDrag({ x: 0, y: 0, active: false });
      apply(direction, recipe);
    }, 200);
  }

  function onPointerDown(event) {
    if (leaving) return;
    if (event.pointerType === "mouse" && event.button !== 0) return;
    start.current = { x: event.clientX, y: event.clientY };
    setDrag({ x: 0, y: 0, active: true });
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event) {
    if (!drag.active) return;
    setDrag({
      x: event.clientX - start.current.x,
      y: event.clientY - start.current.y,
      active: true,
    });
  }

  function onPointerUp() {
    if (!drag.active) return;
    if (drag.x > SWIPE_AT) commit("right");
    else if (drag.x < -SWIPE_AT) commit("left");
    else setDrag({ x: 0, y: 0, active: false });
  }

  const cardStyle = leaving
    ? {
        transform: `translateX(${leaving === "right" ? 120 : -120}%) rotate(${
          leaving === "right" ? 12 : -12
        }deg)`,
        opacity: 0,
      }
    : {
        transform: `translate(${drag.x}px, ${drag.y * 0.2}px) rotate(${
          drag.x / 18
        }deg)`,
      };

  const hint =
    drag.x > 40 ? "add" : drag.x < -40 ? "skip" : null;

  return (
    <div
      className={`sheet-backdrop ${closing ? "closing" : ""}`}
      role="presentation"
      onClick={requestClose}
    >
      <div
        className={`sheet discover-sheet ${closing ? "closing" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Find meals"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="sheet-header">
          <div className="sheet-title">
            <strong>Find meals</strong>
            <span>
              {weekFull
                ? "Every night is planned"
                : !usedInitial && initialDay
                  ? `Pick a meal for ${initialDay}`
                  : `${unplannedDays.length} night${
                      unplannedDays.length === 1 ? "" : "s"
                    } to fill`}
            </span>
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

        <div className="sheet-body discover-body">
          <div className="discover-filters" aria-label="Filter by tag">
            {recipeTags.map((tag) => (
              <button
                key={tag}
                type="button"
                className={`recipe-tag-toggle ${
                  selectedTags.has(tag) ? "active" : ""
                }`}
                aria-pressed={selectedTags.has(tag)}
                onClick={() => toggleTag(tag)}
              >
                {tag}
              </button>
            ))}
          </div>

          <div className="discover-stage">
            {weekFull ? (
              <div className="discover-message">
                <Check size={26} aria-hidden="true" />
                <strong>Your week's full!</strong>
                <p>Every night has a meal. Close to see your plan.</p>
              </div>
            ) : !top ? (
              <div className="discover-message">
                <RotateCcw size={26} aria-hidden="true" />
                <strong>No more matches</strong>
                <p>
                  {selectedTags.size > 0
                    ? "Try removing a filter to see more recipes."
                    : "You've been through every recipe."}
                </p>
              </div>
            ) : (
              <div className="discover-deck">
                {deck[1] && (
                  <article className="discover-card discover-card-behind">
                    <DeckCardBody recipe={deck[1]} />
                  </article>
                )}

                <article
                  className={`discover-card ${
                    drag.active ? "dragging" : ""
                  }`}
                  style={cardStyle}
                  onPointerDown={onPointerDown}
                  onPointerMove={onPointerMove}
                  onPointerUp={onPointerUp}
                  onPointerCancel={onPointerUp}
                >
                  {hint && (
                    <span
                      className={`discover-stamp discover-stamp-${hint}`}
                      aria-hidden="true"
                    >
                      {hint === "add" ? "ADD" : "SKIP"}
                    </span>
                  )}
                  <DeckCardBody recipe={top} />
                </article>
              </div>
            )}
          </div>

          {lastAdded && (
            <p className="discover-toast" role="status">
              Added <strong>{lastAdded.name}</strong> to {lastAdded.day}
            </p>
          )}

          {!weekFull && top && (
            <div className="discover-actions">
              <button
                type="button"
                className="discover-skip"
                onClick={() => commit("left")}
              >
                <X size={18} aria-hidden="true" />
                Skip
              </button>
              <button
                type="button"
                className="discover-add"
                onClick={() => commit("right")}
              >
                <Check size={18} aria-hidden="true" />
                Add to {nextDay}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DeckCardBody({ recipe }) {
  const meta = [
    recipe.category || "Uncategorised",
    recipe.serves ? `Serves ${recipe.serves}` : null,
    recipe.timeMins ? `${recipe.timeMins} min` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="discover-card-body">
      <p className="discover-card-kicker">{recipeSourceLabel(recipe)}</p>

      <strong className="discover-card-name">{recipe.name}</strong>

      <p className="discover-card-sub">{meta}</p>

      {recipe.tags?.length > 0 && (
        <span className="recipe-view-tags discover-card-tags">
          {recipe.tags.map((tag) => (
            <span className="recipe-tag" key={tag}>
              {tag}
            </span>
          ))}
        </span>
      )}

      <p className="discover-card-count">
        {recipe.ingredients?.length || 0} ingredients
      </p>
    </div>
  );
}

export default RecipeDiscoverySheet;
