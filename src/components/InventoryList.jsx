import { useState } from "react";
import { ChevronDown, ChevronUp, Trash2, Package } from "lucide-react";

import { normaliseItemName } from "../utils/itemUtils";
import { groupLabelFor } from "../utils/ingredientMatch";
import { groupBySubcategory } from "../utils/pantrySubcategory";
import { aisleTone } from "../utils/categoryColour";
import { ingredientCatalog } from "../data/ingredientCatalog";
import AddItemRow from "./AddItemRow";
import SwipeRow from "./SwipeRow";
import EmptyState from "./EmptyState";

const catalogNames = ingredientCatalog.map((item) => item.name);

// Sort rows by name (case-insensitive) so each category reads alphabetically.
const byName = (a, b) =>
  a.name.localeCompare(b.name, undefined, { sensitivity: "base" });

// Stock items, grouped into collapsible category sections. Each row is a
// compact tick + name; the category dropdown and Delete live behind the
// chevron so the list stays scannable.
function InventoryList({
  inventory,
  statusFilter = null,
  availableCategories = [],
  newInventoryItem,
  setNewInventoryItem,
  addInventoryItem,
  deleteInventoryItem,
  updateInventoryCategory,
  toggleInventoryActive,
  loadStarterInventory,
  onOpenStockCatalog,
  ingredientGroups = {},
  availableGroups = [],
  updateIngredientGroup,
}) {
  const [searchText, setSearchText] = useState("");
  const [openCategories, setOpenCategories] = useState({});
  const [openSubcategories, setOpenSubcategories] = useState({});
  const [expandedItemId, setExpandedItemId] = useState(null);
  // Edits to the expanded row are buffered here and only applied on Save, so
  // Cancel can discard them — including the group, which used to commit silently
  // on blur.
  const [draft, setDraft] = useState(null);

  function openEditor(item) {
    setExpandedItemId(item.id);
    setDraft({
      category: item.category || "Other",
      group: groupLabelFor(item.name, ingredientGroups),
    });
  }

  function closeEditor() {
    setExpandedItemId(null);
    setDraft(null);
  }

  function saveEditor(item) {
    if (draft.category !== (item.category || "Other")) {
      updateInventoryCategory(item.id, draft.category);
    }
    updateIngredientGroup?.(item.name, draft.group);
    closeEditor();
  }

  const filteredInventory = inventory.filter((item) => {
    const isOut = item.active === false;
    if (statusFilter === "active" && isOut) return false;
    if (statusFilter === "inactive" && !isOut) return false;
    return normaliseItemName(item.name).includes(normaliseItemName(searchText));
  });

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

  function toggleSubcategory(key) {
    setOpenSubcategories((open) => ({ ...open, [key]: !open[key] }));
  }

  function renderRow(item) {
    const isExpanded = expandedItemId === item.id;
    const isOut = item.active === false;

    return (
      <li key={item.id}>
        <SwipeRow
          onDelete={() => deleteInventoryItem(item.id)}
          itemName={item.name}
        >
          <div className="card basics-card">
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
            onClick={() => {
              if (isExpanded) closeEditor();
              else openEditor(item);
            }}
          >
            {isExpanded ? (
              <ChevronUp size={17} aria-hidden="true" />
            ) : (
              <ChevronDown size={17} aria-hidden="true" />
            )}
          </button>
        </div>

        {isExpanded && draft && (
          <div className="basics-editor">
            <select
              value={draft.category}
              aria-label={`${item.name} category`}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  category: event.target.value,
                }))
              }
            >
              {availableCategories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>

            {updateIngredientGroup && (
              <label className="basics-group">
                <span className="basics-group-label">Group</span>
                <input
                  type="text"
                  list="ingredient-group-options"
                  className="basics-group-input"
                  placeholder="e.g. rice"
                  aria-label={`${item.name} group`}
                  value={draft.group}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      group: event.target.value,
                    }))
                  }
                  onKeyDown={(event) => {
                    if (event.key === "Enter") saveEditor(item);
                  }}
                />
                <span className="basics-group-hint small-text">
                  Items in the same group cover each other on your list.
                </span>
              </label>
            )}

            <button
              type="button"
              className="delete-button"
              onClick={() => deleteInventoryItem(item.id)}
            >
              <Trash2 size={15} aria-hidden="true" />
              Delete
            </button>

            <div className="basics-editor-actions">
              <button
                type="button"
                className="secondary"
                onClick={closeEditor}
              >
                Cancel
              </button>
              <button
                type="button"
                className="primary-button"
                onClick={() => saveEditor(item)}
              >
                Save
              </button>
            </div>
          </div>
        )}
          </div>
        </SwipeRow>
      </li>
    );
  }

  return (
    <section className="inventory-panel">
      <input
        type="text"
        aria-label="Search stock"
        placeholder="Search stock..."
        value={searchText}
        onChange={(event) => setSearchText(event.target.value)}
      />

      <p className="small-text stock-hint">
        Ticked items are in stock. Untick one to add it to your shopping list.
      </p>

      <datalist id="ingredient-group-options">
        {availableGroups.map((group) => (
          <option key={group} value={group} />
        ))}
      </datalist>

      {filteredInventory.length === 0 ? (
        inventory.length === 0 ? (
          <EmptyState icon={Package} title="No stock yet">
            Add what's in your cupboards and we'll keep it off your shopping
            list.
          </EmptyState>
        ) : (
          <p className="empty-state">
            No stock matches — try a different search.
          </p>
        )
      ) : (
        Object.entries(groupedInventory).map(([category, items]) => {
          const isOpen =
            searchText || statusFilter
              ? true
              : openCategories[category] ?? false;

          return (
            <div className="shopping-group" key={category}>
              <button
                type="button"
                className="category-toggle"
                data-aisle-tone={aisleTone(category)}
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

              <div className={`collapsible ${isOpen ? "open" : ""}`}>
                <div
                  className="collapsible-inner"
                  inert={!isOpen ? true : undefined}
                >
                  <div className="subcategory-list">
                    {groupBySubcategory(category, [...items].sort(byName)).map((group) => {
                      if (!group.label) {
                        return (
                          <ul className="clean-list" key={group.key}>
                            {group.items.map(renderRow)}
                          </ul>
                        );
                      }

                      const subKey = `${category}:${group.key}`;
                      const subOpen =
                        searchText || statusFilter
                          ? true
                          : openSubcategories[subKey] ?? false;

                      return (
                        <div className="subcategory-group" key={group.key}>
                          <button
                            type="button"
                            className="subcategory-toggle"
                            aria-expanded={subOpen}
                            onClick={() => toggleSubcategory(subKey)}
                          >
                            <span>{group.label}</span>
                            <span className="category-toggle-meta">
                              {group.items.length} item
                              {group.items.length === 1 ? "" : "s"}
                              {subOpen ? (
                                <ChevronUp size={15} aria-hidden="true" />
                              ) : (
                                <ChevronDown size={15} aria-hidden="true" />
                              )}
                            </span>
                          </button>

                          <div
                            className={`collapsible ${subOpen ? "open" : ""}`}
                          >
                            <div
                              className="collapsible-inner"
                              inert={!subOpen ? true : undefined}
                            >
                              <ul className="clean-list">
                                {group.items.map(renderRow)}
                              </ul>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          );
        })
      )}

      {onOpenStockCatalog && (
        <button
          type="button"
          className="tertiary-button browse-catalog"
          onClick={onOpenStockCatalog}
        >
          Browse common items
        </button>
      )}

      <AddItemRow
        value={newInventoryItem}
        setValue={setNewInventoryItem}
        onAdd={addInventoryItem}
        label="Add a stock item"
        placeholder="e.g. Olive oil"
        availableCategories={availableCategories}
        defaultCategory="Pantry"
        suggestions={catalogNames}
      />

      {inventory.length === 0 && (
        <div className="stock-maintenance">
          <button
            type="button"
            className="tertiary-button"
            onClick={loadStarterInventory}
          >
            Add the app's common household items
          </button>

          <p className="small-text stock-maintenance-note">
            Bulk-adds suggested pantry, household and toiletry staples to get
            you started.
          </p>
        </div>
      )}
    </section>
  );
}

export default InventoryList;
