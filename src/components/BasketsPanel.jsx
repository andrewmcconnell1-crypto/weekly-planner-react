import { useMemo, useState } from "react";
import { Check, Plus, ShoppingBasket, Trash2, X } from "lucide-react";

import { rankRecipesByCoverage } from "../utils/recipeCoverage";
import { parseBasketQuantity } from "../utils/basketQuantity";
import { slugifyIdPart } from "../utils/itemUtils";
import { days } from "../utils/mealUtils";
import { formatDate } from "../utils/dateUtils";

// A night is taken if something's cooked there or it's a leftover repeat.
function isTakenNight(meal) {
  if (!meal) return false;
  if (meal.mealType === "repeat") return true;
  return Boolean(meal.recipeId || meal.name);
}

// Weekly baskets: standing Woolworths-style lists. Pick one and the panel
// shows which recipes the house can cook from basket + recurring buys + stock
// — planning in reverse — and lets you drop those straight onto any night of
// this week or next. Items are bulk-pasted (one per line) so an existing
// supermarket list drops straight in.
function BasketsPanel({
  baskets,
  setBaskets,
  recipes,
  staples,
  inventory,
  ingredientGroups,
  planWeeks = [],
  onPlanRecipeOnWeekDay,
}) {
  const [newName, setNewName] = useState("");
  const [openBasketId, setOpenBasketId] = useState(null);
  const [draftItems, setDraftItems] = useState("");
  // Which basket the cookable list is ranked against ("" = stock + recurring only).
  const [cookFromId, setCookFromId] = useState("");
  const [showAllCookable, setShowAllCookable] = useState(false);
  // Transient "Planned for Tuesday" confirmation, keyed by recipe id.
  const [justPlanned, setJustPlanned] = useState({});

  const canPlan = Boolean(onPlanRecipeOnWeekDay) && planWeeks.length > 0;
  const totalFree = planWeeks.reduce(
    (sum, week) =>
      sum + days.filter((day) => !isTakenNight(week.meals[day])).length,
    0
  );

  // A row's slot picker changed: value is "weekKey|day". Assign and confirm.
  function planOnSlot(recipe, value) {
    if (!value) return;
    const [weekKey, day] = value.split("|");
    onPlanRecipeOnWeekDay(weekKey, day, recipe);
    const week = planWeeks.find((entry) => entry.key === weekKey);
    const label = `${day}${week ? ` · ${week.label.toLowerCase()}` : ""}`;
    setJustPlanned((prev) => ({ ...prev, [recipe.id]: label }));
    window.setTimeout(
      () =>
        setJustPlanned((prev) => {
          const next = { ...prev };
          delete next[recipe.id];
          return next;
        }),
      2600
    );
  }

  const openBasket = baskets.find((basket) => basket.id === openBasketId);

  // Live preview of any counts in the basket being edited, so it's clear the
  // "x2" shorthand was understood.
  const draftCounted = draftItems
    .split("\n")
    .map((line) => parseBasketQuantity(line))
    .filter((item) => item.name && item.quantity != null);

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

  // Recipes already cooked on a night this week or next. Leftover repeats reuse
  // the same cook, so they don't claim ingredients again. A basket line with a
  // count ("Beef mince x2") gives that many units for these to claim before it
  // runs out; a line with no count never depletes.
  const recipeById = useMemo(
    () => new Map(recipes.map((recipe) => [recipe.id, recipe])),
    [recipes]
  );
  const plannedCooks = useMemo(() => {
    const cooks = [];
    planWeeks.forEach((week) => {
      days.forEach((day) => {
        const meal = week.meals[day];
        if (!meal || meal.mealType === "repeat") return;
        if (meal.recipeId && recipeById.has(meal.recipeId)) {
          cooks.push(recipeById.get(meal.recipeId));
        }
      });
    });
    return cooks;
  }, [planWeeks, recipeById]);
  const plannedIds = useMemo(
    () => new Set(plannedCooks.map((recipe) => recipe.id)),
    [plannedCooks]
  );

  const ranked = useMemo(
    () =>
      rankRecipesByCoverage({
        recipes,
        basketItems: cookFrom?.items || [],
        staples,
        inventory,
        ingredientGroups,
        plannedRecipes: plannedCooks,
      }),
    [recipes, cookFrom, staples, inventory, ingredientGroups, plannedCooks]
  );
  // Drop recipes already planned, except while their just-planned confirmation
  // is still showing so it can fade out gracefully.
  const cookable = ranked.filter(
    (entry) =>
      entry.tier !== "more" &&
      (!plannedIds.has(entry.recipe.id) || justPlanned[entry.recipe.id])
  );
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
            <span className="basket-card-title">
              <strong>{basket.name}</strong>
              <span className="basket-count small-text">
                {basket.items.length}{" "}
                {basket.items.length === 1 ? "item" : "items"}
              </span>
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
                placeholder={"Chicken thighs\nBeef mince x2\nCoconut milk"}
              />
              <p className="small-text basket-qty-hint">
                Buy more than one? Add{" "}
                <code>x2</code> after an item and it can cover that many meals
                before it runs out. No number means it&apos;s always on hand.
              </p>
              {draftCounted.length > 0 && (
                <div className="basket-qty-preview">
                  {draftCounted.map((item, index) => (
                    <span className="basket-qty-chip" key={`${item.name}-${index}`}>
                      {item.name}
                      <span className="basket-qty-mult">×{item.quantity}</span>
                    </span>
                  ))}
                </div>
              )}
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
          Pick a basket to fold its ingredients in, then drop meals straight
          onto a night.
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

        {canPlan && (
          <p className="cookable-weekstatus small-text">
            {totalFree === 0
              ? "Both weeks are full — clear a night to plan more."
              : `${totalFree} free ${totalFree === 1 ? "night" : "nights"} across this week and next.`}
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
              {visibleCookable.map(({ recipe, missing, tier }) => {
                const planned = justPlanned[recipe.id];
                return (
                <li className="cookable-row" key={recipe.id}>
                  <span className="cookable-headline">
                    <span
                      className={`cookable-badge ${planned ? "cookable-planned-badge" : `cookable-${tier}`}`}
                    >
                      {planned
                        ? "Planned"
                        : tier === "ready"
                          ? "Ready"
                          : `${missing.length} short`}
                    </span>
                    <span className="cookable-name">{recipe.name}</span>
                  </span>

                  <div className="cookable-footer">
                    <span className="cookable-missing small-text">
                      {!planned && missing.length > 0
                        ? `needs ${missing.join(", ")}`
                        : ""}
                    </span>

                    {canPlan &&
                      (planned ? (
                        <span className="cookable-planned small-text">
                          <Check size={14} aria-hidden="true" />
                          {planned}
                        </span>
                      ) : (
                        <select
                          className="cookable-plan-select"
                          aria-label={`Add ${recipe.name} to a night`}
                          value=""
                          disabled={totalFree === 0}
                          onChange={(event) => {
                            planOnSlot(recipe, event.target.value);
                            event.target.value = "";
                          }}
                        >
                          <option value="">
                            {totalFree === 0 ? "Weeks full" : "Add to a night…"}
                          </option>
                          {planWeeks.map((week) => (
                            <optgroup
                              key={week.key}
                              label={`${week.label} (${formatDate(week.start)})`}
                            >
                              {days.map((day) => {
                                const taken = isTakenNight(week.meals[day]);
                                return (
                                  <option
                                    key={day}
                                    value={`${week.key}|${day}`}
                                    disabled={taken}
                                  >
                                    {day}
                                    {taken ? " — taken" : ""}
                                  </option>
                                );
                              })}
                            </optgroup>
                          ))}
                        </select>
                      ))}
                  </div>
                </li>
                );
              })}
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
