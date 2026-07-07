import { useMemo, useState } from "react";
import { CalendarPlus, Check, Plus, ShoppingBasket, Trash2, X } from "lucide-react";

import { rankRecipesByCoverage } from "../utils/recipeCoverage";
import { slugifyIdPart } from "../utils/itemUtils";
import { days } from "../utils/mealUtils";
import { formatDate } from "../utils/dateUtils";

// A night is free if nothing's cooked there and it isn't a leftover repeat.
function isFreeNight(meal) {
  if (!meal) return true;
  if (meal.mealType === "repeat") return false;
  return !meal.recipeId && !meal.name;
}

// Weekly baskets: standing Woolworths-style lists. Pick one and the panel
// shows which recipes the house can cook from basket + recurring buys + stock
// — planning in reverse — and lets you drop those straight onto a night.
// Items are bulk-pasted (one per line) so an existing supermarket list drops
// straight in.
function BasketsPanel({
  baskets,
  setBaskets,
  recipes,
  staples,
  inventory,
  ingredientGroups,
  planWeekMeals = {},
  onPlanRecipeOnDay,
  planWeekStart,
}) {
  const [newName, setNewName] = useState("");
  const [openBasketId, setOpenBasketId] = useState(null);
  const [draftItems, setDraftItems] = useState("");
  // Which basket the cookable list is ranked against ("" = stock + recurring only).
  const [cookFromId, setCookFromId] = useState("");
  const [showAllCookable, setShowAllCookable] = useState(false);
  // Transient "Planned for Tuesday" confirmation, keyed by recipe id.
  const [justPlanned, setJustPlanned] = useState({});

  const freeNights = days.filter((day) => isFreeNight(planWeekMeals[day]));
  const plannedCount = days.length - freeNights.length;
  const canPlan = Boolean(onPlanRecipeOnDay);

  function planNextNight(recipe) {
    const day = freeNights[0];
    if (!day) return;
    onPlanRecipeOnDay(day, recipe);
    setJustPlanned((prev) => ({ ...prev, [recipe.id]: day }));
    window.setTimeout(
      () =>
        setJustPlanned((prev) => {
          const next = { ...prev };
          delete next[recipe.id];
          return next;
        }),
      2500
    );
  }

  const openBasket = baskets.find((basket) => basket.id === openBasketId);

  function addBasket() {
    const name = newName.trim();
    if (!name) return;
    const id = `basket-${slugifyIdPart(name)}-${Date.now().toString(36)}`;
    setBaskets([...baskets, { id, name, items: [] }]);
    setNewName("");
    setOpenBasketId(id);
    setDraftItems("");
  }

  function saveItems(basketId) {
    const items = draftItems
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    setBaskets(
      baskets.map((basket) =>
        basket.id === basketId ? { ...basket, items } : basket
      )
    );
    setOpenBasketId(null);
  }

  function deleteBasket(basketId) {
    setBaskets(baskets.filter((basket) => basket.id !== basketId));
    if (openBasketId === basketId) setOpenBasketId(null);
    if (cookFromId === basketId) setCookFromId("");
  }

  const cookFrom = baskets.find((basket) => basket.id === cookFromId);
  const ranked = useMemo(
    () =>
      rankRecipesByCoverage({
        recipes,
        basketItems: cookFrom?.items || [],
        staples,
        inventory,
        ingredientGroups,
      }),
    [recipes, cookFrom, staples, inventory, ingredientGroups]
  );
  const cookable = ranked.filter((entry) => entry.tier !== "more");
  const visibleCookable = showAllCookable ? cookable : cookable.slice(0, 12);

  return (
    <div className="baskets-panel">
      <div className="recipes-toolbar">
        <div className="recipes-toolbar-text">
          <strong>
            {baskets.length} {baskets.length === 1 ? "basket" : "baskets"}
          </strong>
          <span>Standing shop lists — pick one, see what it cooks.</span>
        </div>
      </div>

      <div className="add-item-row">
        <input
          type="text"
          placeholder="New basket, e.g. Cheap week"
          value={newName}
          onChange={(event) => setNewName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") addBasket();
          }}
        />
        <button type="button" onClick={addBasket}>
          <Plus size={15} aria-hidden="true" />
          Add basket
        </button>
      </div>

      {baskets.map((basket) => (
        <div className="basket-card" key={basket.id}>
          <div className="basket-card-head">
            <span className="basket-card-icon" aria-hidden="true">
              <ShoppingBasket size={17} strokeWidth={1.9} />
            </span>
            <strong>{basket.name}</strong>
            <span className="basket-count small-text">
              {basket.items.length} items
            </span>
            <button
              type="button"
              className="secondary basket-edit"
              onClick={() => {
                if (openBasketId === basket.id) {
                  setOpenBasketId(null);
                  return;
                }
                setOpenBasketId(basket.id);
                setDraftItems(basket.items.join("\n"));
              }}
            >
              {openBasketId === basket.id ? "Close" : "Edit"}
            </button>
            <button
              type="button"
              className="icon-button basket-delete"
              aria-label={`Delete ${basket.name}`}
              onClick={() => deleteBasket(basket.id)}
            >
              <Trash2 size={15} aria-hidden="true" />
            </button>
          </div>

          {openBasket?.id === basket.id && (
            <div className="basket-editor">
              <p className="small-text">
                One item per line — paste your whole Woolworths list straight
                in.
              </p>
              <textarea
                rows={8}
                value={draftItems}
                onChange={(event) => setDraftItems(event.target.value)}
                placeholder={"Chicken thighs\nBasmati rice\nCoconut milk"}
              />
              <button type="button" onClick={() => saveItems(basket.id)}>
                Save items
              </button>
            </div>
          )}
        </div>
      ))}

      <div className="cookable-section">
        <p className="section-kicker">Cook from your kitchen</p>
        <p className="cookable-intro small-text">
          Recipes you can make from what you have. Pick a basket to add its
          ingredients in, then drop meals straight onto a night.
        </p>
        <div className="cookable-chips">
          <button
            type="button"
            className={`chip ${cookFromId === "" ? "active" : ""}`}
            onClick={() => setCookFromId("")}
          >
            Stock only
          </button>
          {baskets.map((basket) => (
            <button
              key={basket.id}
              type="button"
              className={`chip ${cookFromId === basket.id ? "active" : ""}`}
              onClick={() => setCookFromId(basket.id)}
            >
              + {basket.name}
            </button>
          ))}
        </div>

        {canPlan && planWeekStart && (
          <p className="cookable-weekstatus small-text">
            Planning into the week of {formatDate(planWeekStart)} —{" "}
            {freeNights.length === 0
              ? "all 7 nights full"
              : `${plannedCount}/7 planned, ${freeNights.length} free`}
          </p>
        )}

        {cookable.length === 0 ? (
          <p className="small-text cookable-empty">
            Nothing's within reach yet — add items to a basket, or mark more of
            your kitchen as in stock.
          </p>
        ) : (
          <>
            <ul className="cookable-list">
              {visibleCookable.map(({ recipe, missing, tier }) => (
                <li className="cookable-row" key={recipe.id}>
                  <span className={`cookable-badge cookable-${tier}`}>
                    {tier === "ready" ? "Ready" : `${missing.length} short`}
                  </span>
                  <span className="cookable-name">{recipe.name}</span>
                  {missing.length > 0 && (
                    <span className="cookable-missing small-text">
                      needs {missing.join(", ")}
                    </span>
                  )}
                  {canPlan &&
                    (justPlanned[recipe.id] ? (
                      <span className="cookable-planned small-text">
                        <Check size={14} aria-hidden="true" />
                        {justPlanned[recipe.id]}
                      </span>
                    ) : (
                      <button
                        type="button"
                        className="cookable-plan"
                        disabled={freeNights.length === 0}
                        onClick={() => planNextNight(recipe)}
                      >
                        <CalendarPlus size={14} aria-hidden="true" />
                        Add to a night
                      </button>
                    ))}
                </li>
              ))}
            </ul>
            {cookable.length > visibleCookable.length && (
              <button
                type="button"
                className="secondary"
                onClick={() => setShowAllCookable(true)}
              >
                Show all {cookable.length}
              </button>
            )}
            {showAllCookable && (
              <button
                type="button"
                className="secondary"
                onClick={() => setShowAllCookable(false)}
              >
                <X size={14} aria-hidden="true" />
                Show fewer
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default BasketsPanel;
