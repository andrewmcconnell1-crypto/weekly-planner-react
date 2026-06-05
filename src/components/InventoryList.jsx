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
        <section className="section">
            <div className="section-header">
                <h2>Inventory</h2>
            </div>

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
                <ul className="clean-list">
                    {inventory.map((item) => (
                        <li className="card shopping-row" key={item.id}>
                            <div>
                                <label className="active-toggle">
                                    <input
                                        type="checkbox"
                                        checked={item.active !== false}
                                        onChange={() => toggleInventoryActive(item.id)}
                                    />
                                    Have this
                                </label>
                                <strong>{item.name}</strong>

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
        </section>
    );
}

export default InventoryList;