import { useState } from "react";
import { categories } from "../data/categories";
import { normaliseItemName } from "../utils/itemUtils";

function InventoryList({
    inventory,
    newInventoryItem,
    setNewInventoryItem,
    addInventoryItem,
    deleteInventoryItem,
    updateInventoryCategory,
    toggleInventoryActive,
    loadStarterInventory,
}) {
    const [searchText, setSearchText] = useState("");
    const [openCategories, setOpenCategories] = useState({});

    const filteredInventory = inventory.filter((item) =>
        normaliseItemName(item.name).includes(normaliseItemName(searchText))
    );

    const groupedInventory = filteredInventory.reduce((groups, item) => {
        const category = item.category || "Other";

        if (!groups[category]) {
            groups[category] = [];
        }

        groups[category].push(item);

        return groups;
    }, {});

    function toggleCategory(category) {
        setOpenCategories({
            ...openCategories,
            [category]: !openCategories[category],
        });
    }

    return (
        <section className="section">
            <div className="section-header">
                <h2>Inventory</h2>
            </div>

            <p className="small-text">
                Household staples you normally keep stocked. Untick an item when it
                runs out and it will be added to the shopping list.
            </p>

            <button
                type="button"
                className="secondary"
                onClick={loadStarterInventory}
            >
                Load household staples
            </button>

            <input
                type="text"
                placeholder="Search household staples..."
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
            />

            <div className="add-item-row">
                <input
                    type="text"
                    placeholder="Add household staple..."
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

            {filteredInventory.length === 0 ? (
                <p className="empty-state">No matching inventory items.</p>
            ) : (
                Object.entries(groupedInventory).map(([category, items]) => {
                    const isOpen = openCategories[category] ?? false;

                    return (
                        <div className="shopping-group" key={category}>
                            <button
                                type="button"
                                className="category-toggle"
                                onClick={() => toggleCategory(category)}
                            >
                                <span>{category}</span>
                                <span>
                                    {items.length} item{items.length === 1 ? "" : "s"}{" "}
                                    {isOpen ? "▲" : "▼"}
                                </span>
                            </button>

                            {isOpen && (
                                <ul className="clean-list">
                                    {items.map((item) => (
                                        <li className="card shopping-row" key={item.id}>
                                            <div>
                                                <label className="active-toggle">
                                                    <input
                                                        type="checkbox"
                                                        checked={item.active !== false}
                                                        onChange={() => toggleInventoryActive(item.id)}
                                                    />
                                                    In stock
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
                        </div>
                    );
                })
            )}
        </section>
    );
}

export default InventoryList;
