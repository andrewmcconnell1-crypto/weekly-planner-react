import { useState } from "react";
import { X } from "lucide-react";

import WeekControls from "./WeekControls";

// What a row needs to say in the supermarket: the item, and (for meal
// ingredients) which meal it's for. Everything else is noise.
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
  shoppingWeekStart,
  shoppingWeekEnd,
  shoppingWeekMode,
  goToPreviousShoppingWeek,
  goToThisShoppingWeek,
  goToNextShoppingWeekDefault,
  goToNextShoppingWeek,
}) {
  const [collapsedCategories, setCollapsedCategories] = useState({});

  const pendingItems = shoppingItems.filter((item) => !item.checked);
  const doneItems = shoppingItems.filter((item) => item.checked);
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

  function renderShoppingItem(item, index) {
    const detail = getItemDetail(item);

    return (
      <li
        className={`card shopping-row ${item.checked ? "checked-row" : ""}`}
        key={`${item.id}-${index}`}
      >
        <label className={item.checked ? "checked-item" : ""}>
          <input
            type="checkbox"
            checked={item.checked}
            onChange={() => toggleShoppingItem(item.id)}
          />

          <span className="shopping-item-content">
            <span className="shopping-item-name">{item.name}</span>

            {detail && (
              <span className="shopping-source-detail">{detail}</span>
            )}
          </span>
        </label>

        <button
          type="button"
          className="shopping-row-delete"
          aria-label={`Delete ${item.name}`}
          onClick={() => deleteShoppingItem(item.id)}
        >
          <X size={16} aria-hidden="true" />
        </button>
      </li>
    );
  }

  return (
    <section className="screen shop-screen">
      <div className="screen-header">
        <div>
          <p className="section-kicker">Shopping week</p>
          <h2>{formattedShoppingRange}</h2>
        </div>
      </div>

      <WeekControls
        activePreset={shoppingWeekMode}
        onThisWeek={goToThisShoppingWeek}
        onNextWeekPreset={goToNextShoppingWeekDefault}
        onPreviousWeek={goToPreviousShoppingWeek}
        onNextWeek={goToNextShoppingWeek}
      />

      {!hasGeneratedShopPlan || shoppingListNeedsUpdate ? (
        <div
          className={`shop-update-bar ${
            shoppingListNeedsUpdate ? "needs-update" : ""
          }`}
        >
          <span>
            {hasGeneratedShopPlan
              ? "Your meals, stock or recurring buys have changed since this list was made."
              : "Check your stock and recurring buys first, then build the list from your meals."}
          </span>

          <button
            className="primary-button"
            type="button"
            onClick={buildShoppingList}
          >
            {shoppingActionLabel}
          </button>
        </div>
      ) : (
        <p className="shop-refresh-line">
          <span>
            {shoppingLastUpdatedText
              ? `Up to date · ${shoppingLastUpdatedText}`
              : "Up to date"}
          </span>

          <button type="button" onClick={buildShoppingList}>
            Refresh
          </button>
        </p>
      )}

      {recurringRemovalItems.length > 0 && (
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

      {shoppingItems.length === 0 ? (
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
                      <span className="group-count">{items.length}</span>
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
