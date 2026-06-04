function ShoppingList({
  newItem,
  setNewItem,
  addShoppingItem,
  shoppingItems,
  toggleShoppingItem,
  deleteShoppingItem,
  buildShoppingList,
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
    <section className="section">
      <div className="section-header">
        <h2>Shopping List</h2>

        <button type="button" onClick={buildShoppingList}>
          Build this week’s list
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
            <h3>{category}</h3>

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