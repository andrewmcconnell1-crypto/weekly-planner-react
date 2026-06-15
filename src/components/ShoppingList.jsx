import { useState } from "react";
import { ChevronDown, ChevronUp, HelpCircle, X } from "lucide-react";

import WeekControls from "./WeekControls";
import { normaliseItemName } from "../utils/itemUtils";
import { categoriseIngredient } from "../utils/categoriseIngredient";

// What a row needs to say in the supermarket: the item, and (for meal
// ingredients) which meal it's for. Everything else is noise. In the flat
// "full list" view we drop these entirely — it's just a list to shop.
function getItemDetail(item) {
  if (item.source === "Meal") return item.sourceDetail || "";
  if (item.source === "Restock") return "Restock";
  return "";
}

function ShoppingList({
  newItem,
  setNewItem,
  addShoppingItem,
  shoppingItems,
  toggleShoppingItem,
  deleteShoppingItem,
  buildShoppingList,
  shoppingActionLabel,
  shoppingListNeedsUpdate,
  hasGeneratedShopPlan,
  shoppingLastUpdatedText,
  recurringRemovalItems,
  removalAckIds = [],
  pendingRemovalCount,
  onToggleRemoval,
  skippedItems = [],
  onAddSkipped,
  weeksDiverged,
  plannedWeekLabel,
  onShopPlannedWeek,
  shoppingWeekStart,
  shoppingWeekEnd,
  shoppingWeekMode,
  goToPreviousShoppingWeek,
  goToThisShoppingWeek,
  goToNextShoppingWeekDefault,
  goToNextShoppingWeek,
  keepStandingList = true,
  shopListView,
  setShopListView,
  recurringBuyItems = [],
  recurringCheckedIds = [],
  onToggleRecurring,
  onOpenHelp,
}) {
  const [collapsedCategories, setCollapsedCategories] = useState({});

  // "Full list" folds recurring buys into one complete list. People who don't
  // keep a standing list are always in this mode (there's no second list).
  const fullList = !keepStandingList || shopListView === "full";

  // The recurring buys, as toggleable rows, only when we're showing the full
  // list. Their checked state is tracked separately from the generated rows.
  const recurringRows = fullList
    ? recurringBuyItems.map((item) => ({
        ...item,
        source: "Recurring buy",
        checked: recurringCheckedIds.includes(item.id),
        isRecurring: true,
      }))
    : [];

  // In the full list there are no source labels, so meal ingredients sitting in
  // the generic "Meal ingredients" bucket are re-filed into their supermarket
  // aisle (Dairy, Pantry, …) so the by-category grouping is actually useful.
  const baseItems = fullList
    ? shoppingItems.map((item) =>
        item.category === "Meal ingredients"
          ? { ...item, category: categoriseIngredient(item.name) }
          : item
      )
    : shoppingItems;

  const displayItems = [...baseItems, ...recurringRows];

  const pendingItems = displayItems.filter((item) => !item.checked);
  const doneItems = displayItems.filter((item) => item.checked);
  const totalItems = displayItems.length;
  const donePct =
    totalItems > 0 ? Math.round((doneItems.length / totalItems) * 100) : 0;
  const groupedPendingItems = pendingItems.reduce((groups, item) => {
    const category = item.category || "Other";

    if (!groups[category]) {
      groups[category] = [];
    }

    groups[category].push(item);
    return groups;
  }, {});
  const formattedShoppingRange = `${shoppingWeekStart.toLocaleDateString(
    "en-AU",
    { day: "numeric", month: "short" }
  )} – ${shoppingWeekEnd.toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
  })}`;

  function toggleCategory(category) {
    setCollapsedCategories({
      ...collapsedCategories,
      [category]: !collapsedCategories[category],
    });
  }

  function toggleItem(item) {
    if (item.isRecurring) {
      onToggleRecurring(item.id);
    } else {
      toggleShoppingItem(item.id);
    }
  }

  function renderShoppingItem(item, index) {
    const detail = fullList ? "" : getItemDetail(item);

    return (
      <li
        className={`card shopping-row ${item.checked ? "checked-row" : ""}`}
        key={`${item.isRecurring ? "recurring" : "item"}-${item.id}-${index}`}
      >
        <label className={item.checked ? "checked-item" : ""}>
          <input
            type="checkbox"
            checked={item.checked}
            onChange={() => toggleItem(item)}
          />

          <span className="shopping-item-content">
            <span className="shopping-item-name">{item.name}</span>

            {detail && (
              <span className="shopping-source-detail">{detail}</span>
            )}
          </span>
        </label>

        {!item.isRecurring && (
          <button
            type="button"
            className="shopping-row-delete"
            aria-label={`Delete ${item.name}`}
            onClick={() => deleteShoppingItem(item.id)}
          >
            <X size={16} aria-hidden="true" />
          </button>
        )}
      </li>
    );
  }

  return (
    <section className="screen shop-screen">
      <div
        className={`page-hero shop-hero ${
          shoppingListNeedsUpdate ? "needs-update" : ""
        }`}
      >
        <p className="page-hero-kicker">Shopping list · {formattedShoppingRange}</p>

        {hasGeneratedShopPlan ? (
          <>
            <strong className="page-hero-count">
              {pendingItems.length} to buy
            </strong>

            <p className="page-hero-sub">
              {doneItems.length} done · {totalItems} total
              {shoppingListNeedsUpdate
                ? " · needs update"
                : shoppingLastUpdatedText
                  ? ` · updated ${shoppingLastUpdatedText}`
                  : ""}
            </p>

            {totalItems > 0 && (
              <div
                className="shop-hero-progress"
                role="progressbar"
                aria-valuenow={donePct}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <span style={{ width: `${donePct}%` }} />
              </div>
            )}

            <button
              type="button"
              className="page-hero-action"
              onClick={buildShoppingList}
            >
              {shoppingActionLabel}
            </button>
          </>
        ) : (
          <>
            <strong className="page-hero-count">No list yet</strong>

            <p className="page-hero-sub">
              {keepStandingList
                ? "Check your stock and recurring buys first, then build the list from your meals."
                : "Check your stock first, then build one complete list from your meals and recurring buys."}
            </p>

            <button
              type="button"
              className="page-hero-action"
              onClick={buildShoppingList}
            >
              {shoppingActionLabel}
            </button>
          </>
        )}
      </div>

      <div className="shop-controls-row">
        {keepStandingList && (
          <div
            className="shop-list-toggle"
            role="tablist"
            aria-label="Shopping list view"
          >
            <button
              type="button"
              role="tab"
              aria-selected={!fullList}
              className={!fullList ? "active" : ""}
              onClick={() => setShopListView("topup")}
            >
              Top-up
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={fullList}
              className={fullList ? "active" : ""}
              onClick={() => setShopListView("full")}
            >
              Full list
            </button>
          </div>
        )}

        <button
          type="button"
          className="shop-help-link"
          onClick={onOpenHelp}
        >
          <HelpCircle size={15} aria-hidden="true" />
          How shopping works
        </button>
      </div>

      {fullList ? (
        <p className="small-text shop-mode-note">
          {keepStandingList
            ? "Showing everything to buy this week, including your recurring buys — handy for shopping in store."
            : "One complete list: your meal ingredients, restocks and recurring buys, grouped by aisle."}
        </p>
      ) : (
        <p className="small-text shop-mode-note">
          Top-up only: meal ingredients and restocks to add to your standing
          Woolworths list. Your recurring buys aren't repeated here.
        </p>
      )}

      <WeekControls
        activePreset={shoppingWeekMode}
        onThisWeek={goToThisShoppingWeek}
        onNextWeekPreset={goToNextShoppingWeekDefault}
        onPreviousWeek={goToPreviousShoppingWeek}
        onNextWeek={goToNextShoppingWeek}
      />

      {weeksDiverged && (
        <div className="week-mismatch" role="status">
          <span>
            Shopping for {formattedShoppingRange}, but your meal plan is on{" "}
            {plannedWeekLabel}.
          </span>

          <button type="button" className="secondary" onClick={onShopPlannedWeek}>
            Shop the planned week
          </button>
        </div>
      )}

      {!fullList && recurringRemovalItems.length > 0 && (
        <section className="woolworths-removal-section">
          <div className="shopping-section-header">
            <h3>Remove from Woolworths list</h3>
            <span>{pendingRemovalCount ?? recurringRemovalItems.length}</span>
          </div>

          <p className="small-text removal-hint">
            Already covered by stock or turned off — tick each one once you've
            removed it from your standing Woolworths list.
          </p>

          <ul className="clean-list">
            {[...recurringRemovalItems]
              .sort(
                (a, b) =>
                  Number(removalAckIds.includes(a.id)) -
                  Number(removalAckIds.includes(b.id))
              )
              .map((item, index) => {
                const done = removalAckIds.includes(item.id);

                return (
                  <li
                    className={`card shopping-row removal-row ${
                      done ? "checked-row" : ""
                    }`}
                    key={`${item.id}-${index}`}
                  >
                    <label className={done ? "checked-item" : ""}>
                      <input
                        type="checkbox"
                        checked={done}
                        onChange={() => onToggleRemoval(item.id)}
                      />

                      <span className="shopping-item-content">
                        <span className="shopping-item-name">{item.name}</span>
                        <span className="shopping-source-detail">
                          {item.sourceDetail || "Already in stock"}
                        </span>
                      </span>
                    </label>
                  </li>
                );
              })}
          </ul>
        </section>
      )}

      {displayItems.length === 0 ? (
        <p className="empty-state">
          No items yet — generate the list or add one below.
        </p>
      ) : (
        <>
          <section className="shopping-section">
            <div className="shopping-section-header">
              <h3>To buy</h3>
              <span>{pendingItems.length}</span>
            </div>

            {pendingItems.length === 0 ? (
              <p className="empty-state">Everything is checked off.</p>
            ) : (
              Object.entries(groupedPendingItems).map(([category, items]) => {
                const isCollapsed = collapsedCategories[category] === true;

                return (
                  <div className="shopping-group" key={category}>
                    <button
                      className="group-heading"
                      type="button"
                      aria-expanded={!isCollapsed}
                      onClick={() => toggleCategory(category)}
                    >
                      <span className="group-title">{category}</span>
                      <span className="group-heading-meta">
                        <span className="group-count">{items.length}</span>
                        {isCollapsed ? (
                          <ChevronDown size={16} aria-hidden="true" />
                        ) : (
                          <ChevronUp size={16} aria-hidden="true" />
                        )}
                      </span>
                    </button>

                    {!isCollapsed && (
                      <ul className="clean-list">
                        {items.map((item, index) =>
                          renderShoppingItem(item, index)
                        )}
                      </ul>
                    )}
                  </div>
                );
              })
            )}
          </section>

          {doneItems.length > 0 && (
            <details className="done-section" open={pendingItems.length === 0}>
              <summary>
                <span>Done</span>
                <span>{doneItems.length}</span>
              </summary>

              <ul className="clean-list">
                {doneItems.map((item, index) => renderShoppingItem(item, index))}
              </ul>
            </details>
          )}
        </>
      )}

      {!fullList && skippedItems.length > 0 && (
        <details className="skipped-section">
          <summary>
            <span>Already have</span>
            <span>{skippedItems.length}</span>
          </summary>

          <p className="small-text">
            Skipped from your meals because they match something in your stock
            or recurring buys. Add any the smarts got wrong.
          </p>

          <ul className="clean-list">
            {skippedItems.map((skipped, index) => {
              const onList = shoppingItems.some(
                (item) =>
                  normaliseItemName(item.name) ===
                  normaliseItemName(skipped.name)
              );

              return (
                <li className="card skipped-row" key={`${skipped.name}-${index}`}>
                  <span className="skipped-main">
                    <strong>{skipped.name}</strong>
                    {skipped.coveredBy && (
                      <span>You have: {skipped.coveredBy}</span>
                    )}
                  </span>

                  {onList ? (
                    <span className="skipped-added">Added</span>
                  ) : (
                    <button
                      type="button"
                      className="secondary"
                      onClick={() => onAddSkipped(skipped.name)}
                    >
                      Add anyway
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </details>
      )}

      <div className="manual-add-panel">
        <p className="section-kicker">Add an item</p>

        <div className="add-item-row">
          <input
            type="text"
            placeholder="e.g. Coffee"
            value={newItem}
            onChange={(event) => setNewItem(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") addShoppingItem();
            }}
          />

          <button type="button" onClick={addShoppingItem}>
            Add
          </button>
        </div>
      </div>
    </section>
  );
}

export default ShoppingList;
