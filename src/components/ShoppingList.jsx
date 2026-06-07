import { useState } from "react";

function ShoppingList({
  newItem,
  setNewItem,
  addShoppingItem,
  shoppingItems,
  toggleShoppingItem,
  deleteShoppingItem,
  buildShoppingList,
  shoppingActionLabel,
  pendingShoppingItemsCount,
  checkedShoppingItemsCount,
  shoppingWeekStart,
  shoppingWeekEnd,
  goToPreviousShoppingWeek,
  goToNextShoppingWeekDefault,
  goToNextShoppingWeek,
}) {
  const [collapsedCategories, setCollapsedCategories] = useState({});

  const groupedItems = shoppingItems.reduce((groups, item) => {
    const category = item.category || "Other";

    if (!groups[category]) {
      groups[category] = [];
    }

    groups[category].push(item);
    return groups;
  }, {});

  function toggleCategory(category) {
    setCollapsedCategories({
      ...collapsedCategories,
      [category]: !collapsedCategories[category],
    });
  }

  return (
    <section className="screen shop-screen">
      <div className="screen-header">
        <div>
          <p className="section-kicker">Shopping week</p>
          <h2>Shop</h2>
        </div>

        <div className="date-card">
          <span>{shoppingWeekStart.toLocaleDateString("en-AU", {
            weekday: "short",
            day: "numeric",
            month: "short",
          })}</span>
          <span>to</span>
          <span>{shoppingWeekEnd.toLocaleDateString("en-AU", {
            weekday: "short",
            day: "numeric",
            month: "short",
          })}</span>
        </div>
      </div>

      <div className="week-nav">
        <button className="secondary" onClick={goToPreviousShoppingWeek}>
          Previous
        </button>

        <button onClick={goToNextShoppingWeekDefault}>Next Sunday</button>

        <button className="secondary" onClick={goToNextShoppingWeek}>
          Next
        </button>
      </div>

      <div className="primary-action-card">
        <div>
          <strong>Shopping list</strong>
          <p className="small-text">
            {pendingShoppingItemsCount} pending, {checkedShoppingItemsCount} done
          </p>
        </div>

        <button className="primary-button" type="button" onClick={buildShoppingList}>
          {shoppingActionLabel}
        </button>
      </div>

      <div className="add-item-row">
        <input
          type="text"
          placeholder="Add shopping item..."
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

      {shoppingItems.length === 0 ? (
        <p className="empty-state">No shopping items yet.</p>
      ) : (
        Object.entries(groupedItems).map(([category, items]) => {
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
                  {items.map((item, index) => (
                    <li
                      className={`card shopping-row ${
                        item.checked ? "checked-row" : ""
                      }`}
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

                          {item.source && (
                            <span className="shopping-item-source">
                              {item.sourceDetail
                                ? `${item.source}: ${item.sourceDetail}`
                                : item.source}
                            </span>
                          )}
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
                  ))}
                </ul>
              )}
            </div>
          );
        })
      )}
    </section>
  );
}

export default ShoppingList;
