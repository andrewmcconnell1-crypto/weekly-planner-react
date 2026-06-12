import { useState } from "react";

import WeekControls from "./WeekControls";

function getSourceLabel(source) {
  if (source === "Restock") return "Stock";
  if (source === "Recurring buy") return "Recurring";
  if (source === "Generated") return "Generated";
  return source || "Manual";
}

function getSourceClass(source) {
  return `source-${String(source || "manual")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")}`;
}

function ShoppingList({
  newItem,
  setNewItem,
  addShoppingItem,
  shoppingItems,
  toggleShoppingItem,
  deleteShoppingItem,
  renameShoppingItem,
  buildShoppingList,
  shoppingActionLabel,
  shoppingStatusLabel,
  shoppingListNeedsUpdate,
  shoppingListSummary,
  shoppingLastUpdatedText,
  recurringRemovalItems,
  pendingShoppingItemsCount,
  checkedShoppingItemsCount,
  manualShoppingItemsCount,
  shoppingWeekStart,
  shoppingWeekEnd,
  shoppingWeekMode,
  goToPreviousShoppingWeek,
  goToThisShoppingWeek,
  goToNextShoppingWeekDefault,
  goToNextShoppingWeek,
}) {
  const [collapsedCategories, setCollapsedCategories] = useState({});
  const [editingItemId, setEditingItemId] = useState(null);
  const [editingValue, setEditingValue] = useState("");

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
  const formattedShoppingRange = `${shoppingWeekStart.toLocaleDateString("en-AU", {
    weekday: "short",
    day: "numeric",
    month: "short",
  })} to ${shoppingWeekEnd.toLocaleDateString("en-AU", {
    weekday: "short",
    day: "numeric",
    month: "short",
  })}`;

  function toggleCategory(category) {
    setCollapsedCategories({
      ...collapsedCategories,
      [category]: !collapsedCategories[category],
    });
  }

  function commitEdit(item) {
    renameShoppingItem(item.id, editingValue || item.name);
    setEditingItemId(null);
  }

  function renderShoppingItem(item, index) {
    const isEditing = editingItemId === item.id;

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
            {isEditing ? (
              <input
                className="shopping-item-edit"
                type="text"
                autoFocus
                value={editingValue}
                onChange={(e) => setEditingValue(e.target.value)}
                onBlur={() => commitEdit(item)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commitEdit(item);
                  if (e.key === "Escape") setEditingItemId(null);
                }}
                onClick={(e) => e.preventDefault()}
              />
            ) : (
              <span
                className="shopping-item-name"
                role="button"
                tabIndex={0}
                onClick={() => {
                  setEditingItemId(item.id);
                  setEditingValue(item.name);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    setEditingItemId(item.id);
                    setEditingValue(item.name);
                  }
                }}
              >
                {item.name}
              </span>
            )}

            <span className="shopping-item-meta">
              <span className={`source-chip ${getSourceClass(item.source)}`}>
                {getSourceLabel(item.source)}
              </span>

              {item.sourceDetail && (
                <span className="shopping-source-detail">
                  {item.sourceDetail}
                </span>
              )}
            </span>
          </span>
        </label>

        <button
          type="button"
          className="delete-button"
          aria-label={`Delete ${item.name}`}
          onClick={() => deleteShoppingItem(item.id)}
        >
          Delete
        </button>
      </li>
    );
  }

  return (
    <section className="screen shop-screen">
      <div
        className={`shop-status-panel ${
          shoppingListNeedsUpdate ? "needs-update" : ""
        }`}
      >
        <div className="shop-status-heading">
          <div>
            <span>Shopping week</span>
            <strong>{formattedShoppingRange}</strong>
          </div>

          <span
            className={`list-status-pill ${
              shoppingListNeedsUpdate ? "needs-update" : ""
            }`}
          >
            {shoppingStatusLabel}
          </span>
        </div>

        <div className="shop-stat-grid">
          <div>
            <span>Additions</span>
            <strong>{pendingShoppingItemsCount}</strong>
          </div>

          <div>
            <span>Done</span>
            <strong>{checkedShoppingItemsCount}</strong>
          </div>

          <div>
            <span>Remove</span>
            <strong>{recurringRemovalItems.length}</strong>
          </div>

          <div>
            <span>Manual</span>
            <strong>{manualShoppingItemsCount}</strong>
          </div>
        </div>
      </div>

      <WeekControls
        activePreset={shoppingWeekMode}
        onThisWeek={goToThisShoppingWeek}
        onNextWeekPreset={goToNextShoppingWeekDefault}
        onPreviousWeek={goToPreviousShoppingWeek}
        onNextWeek={goToNextShoppingWeek}
      />

      <div
        className={`primary-action-card shop-action-card ${
          shoppingListNeedsUpdate ? "needs-update" : ""
        }`}
      >
        <div>
          <p className="small-text">
            {shoppingLastUpdatedText
              ? `Last updated ${shoppingLastUpdatedText}`
              : "Generate additions and Woolworths list removals from meals and stock."}
          </p>
        </div>

        <button className="primary-button" type="button" onClick={buildShoppingList}>
          {shoppingActionLabel}
        </button>
      </div>

      {shoppingListSummary && (
        <div className="generation-summary">
          <span>
            {shoppingListSummary.mealIngredientsAdded} meal
          </span>
          <span>
            {shoppingListSummary.stockRestocksAdded} stock
          </span>
          <span>
            {shoppingListSummary.recurringRemovalsFound} removals
          </span>
          <span>
            {shoppingListSummary.skippedRecurringList} already on Woolworths
          </span>
        </div>
      )}

      {recurringRemovalItems.length > 0 && (
        <section className="woolworths-removal-section">
          <div className="shopping-section-header">
            <h3>Remove from Woolworths list</h3>
            <span>{recurringRemovalItems.length}</span>
          </div>

          <ul className="clean-list">
            {recurringRemovalItems.map((item, index) => (
              <li
                className="card removal-row"
                key={`${item.id}-${index}`}
              >
                <span>
                  <strong>{item.name}</strong>
                  <span>Already in stock</span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {shoppingItems.length === 0 ? (
        <p className="empty-state">
          No additions yet. Generate additions or add an item manually.
        </p>
      ) : (
        <>
          <section className="shopping-section">
            <div className="shopping-section-header">
              <h3>Additional items</h3>
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
            <details
              className="done-section"
              open={pendingItems.length === 0}
            >
              <summary>
                <span>Done</span>
                <span>{doneItems.length}</span>
              </summary>

              <ul className="clean-list">
                {doneItems.map((item, index) =>
                  renderShoppingItem(item, index)
                )}
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
