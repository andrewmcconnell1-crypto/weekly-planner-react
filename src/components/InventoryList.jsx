import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

import { categories } from "../data/categories";
import { normaliseItemName } from "../utils/itemUtils";

// Stock items, grouped into collapsible category sections. Each row is a
// compact tick + name; the category dropdown and Delete live behind the
// chevron so the list stays scannable.
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
  const [expandedItemId, setExpandedItemId] = useState(null);

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
        <h2>Stock</h2>
      </div>

      <p className="small-text">
        Pantry, household, and toiletry items you keep stocked.
      </p>

      <input
        type="text"
        placeholder="Search stock..."
        value={searchText}
        onChange={(event) => setSearchText(event.target.value)}
      />

      <p className="small-text stock-hint">
        Ticked items are in stock. Untick one to add it to your shopping list.
      </p>

      {filteredInventory.length === 0 ? (
        <p className="empty-state">No matching stock items.</p>
      ) : (
        Object.entries(groupedInventory).map(([category, items]) => {
          const isOpen = openCategories[category] ?? false;

          return (
            <div className="shopping-group" key={category}>
              <button
                type="button"
                className="category-toggle"
                aria-expanded={isOpen}
                onClick={() => toggleCategory(category)}
              >
                <span>{category}</span>
                <span className="category-toggle-meta">
                  {items.length} item{items.length === 1 ? "" : "s"}
                  {isOpen ? (
                    <ChevronUp size={16} aria-hidden="true" />
                  ) : (
                    <ChevronDown size={16} aria-hidden="true" />
                  )}
                </span>
              </button>

              {isOpen && (
                <ul className="clean-list">
                  {items.map((item) => {
                    const isExpanded = expandedItemId === item.id;
                    const isOut = item.active === false;

                    return (
                      <li className="card basics-card" key={item.id}>
                        <div className="basics-row">
                          <input
                            type="checkbox"
                            checked={item.active !== false}
                            aria-label={`${item.name} in stock`}
                            onChange={() => toggleInventoryActive(item.id)}
                          />

                          <div className="basics-row-main">
                            <strong className={isOut ? "basics-name-off" : ""}>
                              {item.name}
                            </strong>

                            {isOut && (
                              <span className="staple-off-note">
                                Out — will be added to your shopping list
                              </span>
                            )}
                          </div>

                          <button
                            type="button"
                            className="basics-edit-toggle"
                            aria-expanded={isExpanded}
                            aria-label={`Edit ${item.name}`}
                            onClick={() =>
                              setExpandedItemId(isExpanded ? null : item.id)
                            }
                          >
                            {isExpanded ? (
                              <ChevronUp size={17} aria-hidden="true" />
                            ) : (
                              <ChevronDown size={17} aria-hidden="true" />
                            )}
                          </button>
                        </div>

                        {isExpanded && (
                          <div className="basics-editor">
                            <select
                              value={item.category || "Other"}
                              aria-label={`${item.name} category`}
                              onChange={(event) =>
                                updateInventoryCategory(
                                  item.id,
                                  event.target.value
                                )
                              }
                            >
                              {categories.map((category) => (
                                <option key={category} value={category}>
                                  {category}
                                </option>
                              ))}
                            </select>

                            <button
                              type="button"
                              className="delete-button"
                              onClick={() => deleteInventoryItem(item.id)}
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })
      )}

      <div className="add-item-row basics-add-row">
        <input
          type="text"
          placeholder="Add stock item..."
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

      <div className="stock-maintenance">
        <button
          type="button"
          className="tertiary-button"
          onClick={loadStarterInventory}
        >
          Add missing stock items
        </button>
      </div>
    </section>
  );
}

export default InventoryList;
