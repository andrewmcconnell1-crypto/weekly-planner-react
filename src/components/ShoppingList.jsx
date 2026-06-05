function ShoppingList({
  newItem,
  setNewItem,
  addShoppingItem,
  shoppingItems,
  toggleShoppingItem,
  deleteShoppingItem,
  buildShoppingList,
  shoppingWeekStart,
  shoppingWeekEnd,
  goToPreviousShoppingWeek,
  goToNextShoppingWeekDefault,
  goToNextShoppingWeek,
}) {
  const groupedItems = shoppingItems.reduce((groups, item) => {
    const category = item.category || "Other";

    if (!groups[category]) {
      groups[category] = [];
    }

    groups[category].push(item);
    return groups;
  }, {});

  return (
    <section className="screen shop-screen">
      <div className="screen-header">
        <div>
          <p className="section-kicker">Shopping week</p>
          <h2>List</h2>
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
        <strong>Next shop</strong>

        <button className="primary-button" type="button" onClick={buildShoppingList}>
          Generate Shopping List
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
        Object.entries(groupedItems).map(([category, items]) => (
          <div className="shopping-group" key={category}>
            <div className="group-heading">
              <h3>{category}</h3>
              <span>{items.length}</span>
            </div>

            <ul className="clean-list">
              {items.map((item) => (
                <li className="card shopping-row" key={item.id}>
                  <label className={item.checked ? "checked-item" : ""}>
                    <input
                      type="checkbox"
                      checked={item.checked}
                      onChange={() => toggleShoppingItem(item.id)}
                    />

                    {item.name}
                  </label>

                  <button
                    type="button"
                    className="delete-button"
                    onClick={() => deleteShoppingItem(item.id)}
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))
      )}
    </section>
  );
}

export default ShoppingList;
