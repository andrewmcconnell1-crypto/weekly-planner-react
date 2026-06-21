import { useEffect, useMemo, useRef, useState } from "react";
import {
  Baby,
  Boxes,
  Check,
  ChevronLeft,
  CookingPot,
  Flame,
  Leaf,
  RotateCcw,
  Timer,
  X,
} from "lucide-react";

import RecipeDetail from "./RecipeDetail";
import { recipeSourceLabel, recipeTags } from "../utils/recipeUtils";
import { days } from "../utils/mealUtils";

// Swipe-to-plan: a filtered deck of recipe cards. Swipe right (or "Add") drops
// the recipe onto the next empty night; swipe left (or "Skip") passes. Filters
// narrow the deck by tag. The Skip/Add buttons are the reliable path; the drag
// is an enhancement, so both route through the same commit().
const SWIPE_AT = 90;

// A short guided flow shown before the deck. Each yes/no question maps to one of
// the recipe tags; "yes" answers pre-filter the deck so swiping starts from a
// shortlist. The tag names double as the "yes" label so the deck's filter chips
// line up with what was chosen. Skippable at any point.
const WIZARD_STEPS = [
  { tag: "Quick", question: "Short on time tonight?", icon: Timer },
  { tag: "Vegetarian", question: "Keep it meat-free?", icon: Leaf },
  { tag: "Kid-friendly", question: "Cooking for kids?", icon: Baby },
  { tag: "Leftover-friendly", question: "Want leftovers for later?", icon: Boxes },
  { tag: "One-pot", question: "Minimal washing up?", icon: CookingPot },
  { tag: "Spicy", question: "In the mood for spice?", icon: Flame },
];

function RecipeDiscoverySheet({
  recipes,
  unplannedDays = [],
  initialDay = null,
  plannedRecipeIds = [],
  onAssign,
  onClose,
}) {
  const [stage, setStage] = useState("wizard"); // "wizard" | "deck"
  const [stepIndex, setStepIndex] = useState(0);
  const [selectedTags, setSelectedTags] = useState(() => new Set());
  const [handled, setHandled] = useState(() => new Set());
  const [usedInitial, setUsedInitial] = useState(false);
  const [lastAdded, setLastAdded] = useState(null);
  const [pendingAdd, setPendingAdd] = useState(null); // { recipe, day, maxNights }
  const [drag, setDrag] = useState({ x: 0, y: 0, active: false });
  const [exiting, setExiting] = useState(null); // { recipe, direction, fromX }
  const [closing, setClosing] = useState(false);
  const start = useRef({ x: 0, y: 0 });
  const axis = useRef(null); // null until the gesture locks to "x" or "y"
  const activePointer = useRef(null);
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

  // Record the answer (add or remove this step's tag so going back and changing
  // an answer stays correct), then advance — finishing the last step lands on
  // the deck.
  function answerStep(wantsTag) {
    const { tag } = WIZARD_STEPS[stepIndex];
    setSelectedTags((prev) => {
      const next = new Set(prev);
      if (wantsTag) next.add(tag);
      else next.delete(tag);
      return next;
    });
    if (stepIndex + 1 >= WIZARD_STEPS.length) setStage("deck");
    else setStepIndex((index) => index + 1);
  }

  function backStep() {
    setStepIndex((index) => Math.max(0, index - 1));
  }

  function skipWizard() {
    setStage("deck");
  }

  // How many nights this meal could cover from `startDay`: itself plus the run
  // of empty days immediately after it (leftovers fill consecutive days only,
  // and can't overwrite a planned day or spill past the end of the week).
  function maxLeftoverNights(startDay) {
    const emptyDays = new Set(unplannedDays);
    const startIndex = days.indexOf(startDay);

    if (startIndex === -1) return 1;

    let nights = 1;
    for (let index = startIndex + 1; index < days.length; index += 1) {
      if (!emptyDays.has(days[index])) break;
      nights += 1;
    }

    return nights;
  }

  // Fly the chosen card off as a separate layer on top from where it was
  // released, and drop it into the handled set so the deck advances underneath.
  function flyOff(recipe, direction, fromX) {
    setHandled((prev) => new Set(prev).add(recipe.id));
    setDrag({ x: 0, y: 0, active: false });
    setExiting({ recipe, direction, fromX });
    commitTimer.current = window.setTimeout(() => setExiting(null), 320);
  }

  // Commit an add: assign the recipe (with leftovers for nights > 1, applied in
  // a single update) and animate the card away.
  function finalizeAdd(recipe, day, nights, fromX) {
    onAssign(day, recipe, nights);
    setLastAdded({ name: recipe.name, day, nights });
    if (day === initialDay) setUsedInitial(true);
    flyOff(recipe, "right", fromX);
  }

  // Confirm the mandatory nights pick for the held card, then commit.
  function confirmNights(nights) {
    if (!pendingAdd) return;
    const { recipe, day } = pendingAdd;
    setPendingAdd(null);
    finalizeAdd(recipe, day, nights, 0);
  }

  // Back out of a held add (e.g. swiped right by mistake) — the card snaps back
  // and nothing is assigned.
  function cancelPendingAdd() {
    setPendingAdd(null);
    setDrag({ x: 0, y: 0, active: false });
  }

  // Advance the deck immediately (so the next card sits stationary at centre).
  // A right commit first holds the card for a mandatory "how many nights?" pick
  // whenever leftovers are possible; a single-night day commits straight away.
  function commit(direction) {
    if (exiting || !top || pendingAdd) return;

    if (direction === "right") {
      if (weekFull) {
        setDrag({ x: 0, y: 0, active: false }); // nothing to fill — snap back
        return;
      }

      const recipe = top;
      const maxNights = maxLeftoverNights(nextDay);

      if (maxNights > 1) {
        setDrag({ x: 0, y: 0, active: false }); // hold the card centred
        setPendingAdd({ recipe, day: nextDay, maxNights });
        return;
      }

      finalizeAdd(recipe, nextDay, 1, drag.x);
      return;
    }

    flyOff(top, "left", drag.x);
  }

  // Axis-lock: don't capture the pointer or start dragging until the gesture
  // proves itself horizontal. That leaves vertical drags (scrolling the
  // expanded recipe) and plain taps (the "View recipe" toggle) to behave
  // normally.
  function onPointerDown(event) {
    if (exiting || pendingAdd) return;
    if (event.pointerType === "mouse" && event.button !== 0) return;
    start.current = { x: event.clientX, y: event.clientY };
    axis.current = null;
    activePointer.current = event.pointerId;
  }

  function onPointerMove(event) {
    if (activePointer.current !== event.pointerId) return;
    const x = event.clientX - start.current.x;
    const y = event.clientY - start.current.y;

    if (!axis.current) {
      if (Math.abs(x) < 8 && Math.abs(y) < 8) return;
      axis.current = Math.abs(x) > Math.abs(y) ? "x" : "y";
      if (axis.current === "x") {
        event.currentTarget.setPointerCapture(event.pointerId);
      }
    }

    if (axis.current !== "x") return;
    setDrag({ x, y, active: true });
  }

  function onPointerUp(event) {
    if (activePointer.current !== event.pointerId) return;
    activePointer.current = null;
    const wasHorizontal = axis.current === "x";
    axis.current = null;
    if (!wasHorizontal) return;
    if (drag.x > SWIPE_AT) commit("right");
    else if (drag.x < -SWIPE_AT) commit("left");
    else setDrag({ x: 0, y: 0, active: false });
  }

  // Clear pending timers if the sheet unmounts mid-animation.
  useEffect(
    () => () => {
      window.clearTimeout(commitTimer.current);
      window.clearTimeout(closeTimer.current);
    },
    []
  );

  const cardStyle = {
    transform: `translate(${drag.x}px, ${drag.y * 0.2}px) rotate(${
      drag.x / 18
    }deg)`,
  };

  const hint = drag.x > 24 ? "add" : drag.x < -24 ? "skip" : null;
  const hintOpacity = Math.min(1, (Math.abs(drag.x) - 24) / 80);
  const showMessage = !exiting && (weekFull || !top);
  // Skip the questions when there's nothing to plan — the week-full state shows
  // straight away instead.
  const inWizard = stage === "wizard" && !weekFull;
  const step = WIZARD_STEPS[stepIndex];
  const StepIcon = step.icon;

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
                : inWizard
                  ? "A few quick questions"
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
          {inWizard ? (
            <div className="discover-wizard">
              <div className="discover-wizard-top">
                {stepIndex > 0 ? (
                  <button
                    type="button"
                    className="discover-wizard-back"
                    onClick={backStep}
                  >
                    <ChevronLeft size={16} aria-hidden="true" />
                    Back
                  </button>
                ) : (
                  <span />
                )}
                <span className="discover-wizard-count">
                  {stepIndex + 1} of {WIZARD_STEPS.length}
                </span>
              </div>

              <div className="discover-wizard-dots" aria-hidden="true">
                {WIZARD_STEPS.map((wizardStep, index) => (
                  <span
                    key={wizardStep.tag}
                    className={`discover-wizard-dot ${
                      index <= stepIndex ? "active" : ""
                    }`}
                  />
                ))}
              </div>

              <div key={step.tag} className="discover-wizard-card">
                <span className="discover-wizard-icon">
                  <StepIcon size={30} aria-hidden="true" />
                </span>
                <strong className="discover-wizard-question">
                  {step.question}
                </strong>
                <div className="discover-wizard-options">
                  <button
                    type="button"
                    className="discover-wizard-yes"
                    onClick={() => answerStep(true)}
                  >
                    <Check size={16} aria-hidden="true" />
                    Yes
                  </button>
                  <button
                    type="button"
                    className="discover-wizard-no"
                    onClick={() => answerStep(false)}
                  >
                    No preference
                  </button>
                </div>
              </div>

              <button
                type="button"
                className="discover-wizard-skip"
                onClick={skipWizard}
              >
                Skip to swiping
              </button>
            </div>
          ) : (
            <>
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
            {showMessage ? (
              <div className="discover-message">
                {weekFull ? (
                  <>
                    <Check size={26} aria-hidden="true" />
                    <strong>Your week's full!</strong>
                    <p>Every night has a meal. Close to see your plan.</p>
                  </>
                ) : (
                  <>
                    <RotateCcw size={26} aria-hidden="true" />
                    <strong>No more matches</strong>
                    <p>
                      {selectedTags.size > 0
                        ? "Try removing a filter to see more recipes."
                        : "You've been through every recipe."}
                    </p>
                  </>
                )}
              </div>
            ) : (
              <div className="discover-deck">
                {!weekFull && top && (
                  <article
                    key={top.id}
                    className={`discover-card discover-card-top ${
                      drag.active ? "dragging" : ""
                    } ${hint ? `discover-card-${hint}` : ""}`}
                    style={cardStyle}
                    onPointerDown={onPointerDown}
                    onPointerMove={onPointerMove}
                    onPointerUp={onPointerUp}
                    onPointerCancel={onPointerUp}
                  >
                    {hint && (
                      <span
                        className={`discover-stamp discover-stamp-${hint}`}
                        style={{ opacity: hintOpacity }}
                        aria-hidden="true"
                      >
                        {hint === "add" ? "ADD" : "SKIP"}
                      </span>
                    )}
                    <DeckCardBody recipe={top} />
                  </article>
                )}

                {exiting && (
                  <article
                    key={`exit-${exiting.recipe.id}`}
                    className={`discover-card discover-card-exit discover-card-exit-${exiting.direction}`}
                    style={{ "--from-x": `${exiting.fromX}px` }}
                  >
                    <DeckCardBody recipe={exiting.recipe} />
                  </article>
                )}
              </div>
            )}
          </div>

          {lastAdded && !pendingAdd && (
            <p className="discover-toast" role="status">
              Added <strong>{lastAdded.name}</strong> to {lastAdded.day}
              {lastAdded.nights > 1
                ? ` for ${lastAdded.nights} nights`
                : ""}
            </p>
          )}

              {pendingAdd ? (
                <div
                  className="discover-nights"
                  role="group"
                  aria-label={`How many nights for ${pendingAdd.recipe.name}`}
                >
                  <p className="discover-nights-title">
                    How many nights will this cover?
                  </p>
                  <p className="discover-nights-sub">
                    Cook once on {pendingAdd.day}, eat the leftovers after.
                  </p>

                  <div className="discover-nights-options">
                    {Array.from(
                      { length: pendingAdd.maxNights },
                      (_, index) => index + 1
                    ).map((nights) => (
                      <button
                        key={nights}
                        type="button"
                        className="discover-nights-option"
                        aria-label={`${nights} ${
                          nights === 1 ? "night" : "nights"
                        }`}
                        onClick={() => confirmNights(nights)}
                      >
                        <strong>{nights}</strong>
                        <span>{nights === 1 ? "night" : "nights"}</span>
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    className="discover-nights-cancel"
                    onClick={cancelPendingAdd}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                !weekFull &&
                top && (
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
                )
              )}
            </>
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

      <RecipeDetail
        variant="hero"
        ingredients={recipe.ingredients || []}
        method={recipe.method || ""}
        sourceUrl={recipe.sourceUrl || ""}
      />
    </div>
  );
}

export default RecipeDiscoverySheet;
