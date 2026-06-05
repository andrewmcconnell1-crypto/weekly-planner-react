import { categories } from "../data/categories";

function InventoryList({
    inventory,
    newInventoryItem,
    setNewInventoryItem,
    addInventoryItem,
    deleteInventoryItem,
    updateInventoryCategory,
    toggleInventoryActive,
}) {
    return (
        <div className="inventory-panel">
            <p className="small-text">
                Groceries you already have at home.
            </p>

            <div className="add-item-row">
                <input
                    type="text"
                    placeholder="Add inventory item..."
                    value={newInventoryItem}
                    onChange={(event) => setNewInventoryItem(event.target.value)}
                    onKeyDown={(event) => {
                        if (event.key === "Enter") addInventoryItem();
                    }}
                />

                <button type="button" onClick={addInventoryItem}>
                    Add
                </button>
            </div>

            {inventory.length === 0 ? (
                <p className="empty-state">No inventory items yet.</p>
            ) : (
                <ul className="inventory-list">
                    {inventory.map((item) => (
                        <li className="card inventory-card" key={item.id}>
                            <div className="inventory-main">
                                <div className="staple-title-row">
                                    <strong>{item.name}</strong>

                                <label className="active-toggle">
                                    <input
                                        type="checkbox"
                                        checked={item.active !== false}
                                        onChange={() => toggleInventoryActive(item.id)}
                                    />
                                    Have this
                                </label>
                                </div>

                                <select
                                    value={item.category || "Other"}
                                    onChange={(event) =>
                                        updateInventoryCategory(item.id, event.target.value)
                                    }
                                >
                                    {categories.map((category) => (
                                        <option key={category} value={category}>
                                            {category}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <button
                                type="button"
                                className="delete-button"
                                onClick={() => deleteInventoryItem(item.id)}
                            >
                                Delete
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

export default InventoryList;
