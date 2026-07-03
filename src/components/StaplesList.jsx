import { useState } from "react";
import { ChevronDown, ChevronUp, Trash2, Repeat2 } from "lucide-react";

import { categories } from "../data/categories";
import { normaliseItemName } from "../utils/itemUtils";
import { groupLabelFor } from "../utils/ingredientMatch";
import { groupBySubcategory } from "../utils/pantrySubcategory";
import { aisleTone } from "../utils/categoryColour";
import AddItemRow from "./AddItemRow";
import SwipeRow from "./SwipeRow";
import EmptyState from "./EmptyState";

const frequencyLabels = {
  weekly: "Weekly",
  fortnightly: "Fortnightly",
  "four-weekly": "4-weekly",
  "ad-hoc": "Ad hoc",
};

// Sort rows by name (case-insensitive) so each category reads alphabetically.
const byName = (a, b) =>
  a.name.localeCompare(b.name, undefined, { sensitivity: "base" });

// Order items into category sections following the canonical category order,
// with any unknown categories sorted alphabetically at the end.
function groupByCategory(items) {
  const groups = items.reduce((acc, item) => {
    const category = item.category || "Other";

    if (!acc[category]) acc[category] = [];
    acc[category].push(item);
    return acc;
  }, {});

  return Object.entries(groups).sort(([a], [b]) => {
    const aIndex = categories.indexOf(a);
    const bIndex = categories.indexOf(b);

    if (aIndex === -1 && bIndex === -1) return a.localeCompare(b);
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    return aIndex - bIndex;
  });
}

// Recurring buys, laid out like the stock list: collapsible category sections
// of compact tick + name rows, with the rarely-touched details (qty, frequency,
// category, delete) behind the per-row chevron.
function StaplesList({
  staples,
  availableCategories = [],
  newStaple,
  setNewStaple,
  addStaple,
  deleteStaple,
  updateStapleFrequency,
  updateStapleCategory,
  updateStapleDetails,
  toggleStapleActive,
  loadStarterStaples,
  ingredientGroups = {},
  availableGroups = [],
  updateIngredientGroup,
}) {
  const [searchText, setSearchText] = useState("");
  const [openCategories, setOpenCategories] = useState({});
  const [openSubcategories, setOpenSubcategories] = useState({});
  const [expandedStapleId, setExpandedStapleId] = useState(null);
  // Edits to the expanded row are buffered here and only applied on Save, so
  // Cancel can discard them.
  const [draft, setDraft] = useState(null);

  function openEditor(staple) {
    setExpandedStapleId(staple.id);
    setDraft({
      quantity: staple.quantity ?? "",
      unit: staple.unit || "",
      frequency: staple.frequency,
      category: staple.category || "Other",
      group: groupLabelFor(staple.name, ingredientGroups),
    });
  }

  function closeEditor() {
    setExpandedStapleId(null);
    setDraft(null);
  }

  function saveEditor(staple) {
    updateStapleDetails(staple.id, {
      quantity: draft.quantity === "" ? null : Number(draft.quantity),
      unit: draft.unit,
    });
    if (draft.frequency !== staple.frequency) {
      updateStapleFrequency(staple.id, draft.frequency);
    }
    if (draft.category !== (staple.category || "Other")) {
      updateStapleCategory(staple.id, draft.category);
    }
    updateIngredientGroup?.(staple.name, draft.group);
    closeEditor();
  }

  const filteredStaples = staples.filter((staple) =>
    normaliseItemName(staple.name).includes(normaliseItemName(searchText))
  );
  const groupedStaples = groupByCategory(filteredStaples);

  function toggleCategory(category) {
    setOpenCategories({
      ...openCategories,
      [category]: !openCategories[category],
    });
  }

  function toggleSubcategory(key) {
    setOpenSubcategories((open) => ({ ...open, [key]: !open[key] }));
  }

  function renderRow(staple) {
    const isExpanded = expandedStapleId === staple.id;
    const isOff = staple.active === false;
    const showFrequency = staple.frequency && staple.frequency !== "weekly";

    return (
      <li key={staple.id}>
        <SwipeRow
          onDelete={() => deleteStaple(staple.id)}
          itemName={staple.name}
        >
          <div className="card basics-card">
            <div className="basics-row">
          <input
            type="checkbox"
            checked={staple.active}
            aria-label={`${staple.name} on Woolworths list`}
            onChange={() => toggleStapleActive(staple.id)}
          />

          <div className="basics-row-main">
            <strong className={isOff ? "basics-name-off" : ""}>
              {staple.name}
            </strong>

            {showFrequency && (
              <span>{frequencyLabels[staple.frequency]}</span>
            )}

            {isOff && (
              <span className="staple-off-note">
                Off — flagged on the Shop page to remove from your Woolworths
                list
              </span>
            )}
          </div>

          <button
            type="button"
            className="basics-edit-toggle"
            aria-expanded={isExpanded}
            aria-label={`Edit ${staple.name}`}
            onClick={() => {
              if (isExpanded) closeEditor();
              else openEditor(staple);
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
            <div className="staple-quantity-row">
              <input
                type="number"
                min="0"
                step="any"
                inputMode="decimal"
                placeholder="Qty"
                aria-label={`${staple.name} quantity`}
                value={draft.quantity}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    quantity: event.target.value,
                  }))
                }
              />

              <input
                type="text"
                placeholder="unit (e.g. pack)"
                aria-label={`${staple.name} unit`}
                value={draft.unit}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    unit: event.target.value,
                  }))
                }
              />
            </div>

            <div className="staple-controls">
              <select
                value={draft.frequency}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    frequency: event.target.value,
                  }))
                }
              >
                <option value="weekly">Weekly</option>
                <option value="fortnightly">Fortnightly</option>
                <option value="four-weekly">4-weekly</option>
                <option value="ad-hoc">Ad hoc</option>
              </select>

              <select
                value={draft.category}
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
            </div>

            {updateIngredientGroup && (
              <label className="basics-group">
                <span className="basics-group-label">Group</span>
                <input
                  type="text"
                  list="ingredient-group-options"
                  className="basics-group-input"
                  placeholder="e.g. rice"
                  aria-label={`${staple.name} group`}
                  value={draft.group}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      group: event.target.value,
                    }))
                  }
                  onKeyDown={(event) => {
                    if (event.key === "Enter") saveEditor(staple);
                  }}
                />
                <span className="basics-group-hint small-text">
                  Items in the same group cover each other on your list.
                </span>
              </label>
            )}

            <p className="small-text">Starts: {staple.startDate}</p>

            <button
              type="button"
              className="delete-button"
              onClick={() => deleteStaple(staple.id)}
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
                onClick={() => saveEditor(staple)}
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
    <div className="staples-panel">
      <input
        type="text"
        aria-label="Search recurring buys"
        placeholder="Search recurring buys..."
        value={searchText}
        onChange={(event) => setSearchText(event.target.value)}
      />

      <p className="small-text stock-hint">
        Ticked items stay on your Woolworths list. Untick one to flag it for
        removal this week.
      </p>

      <datalist id="ingredient-group-options">
        {availableGroups.map((group) => (
          <option key={group} value={group} />
        ))}
      </datalist>

      {staples.length === 0 ? (
        <EmptyState icon={Repeat2} title="No recurring buys yet">
          Add the staples you grab every week and they'll fill in your list
          automatically.
        </EmptyState>
      ) : filteredStaples.length === 0 ? (
        <p className="empty-state">No matching recurring buys.</p>
      ) : (
        groupedStaples.map(([category, items]) => {
          const isOpen = searchText ? true : openCategories[category] ?? false;

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
                <div className="collapsible-inner" inert={!isOpen ? true : undefined}>
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
                      const subOpen = searchText
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

      <AddItemRow
        value={newStaple}
        setValue={setNewStaple}
        onAdd={addStaple}
        label="Add a recurring buy"
        placeholder="e.g. Milk"
        availableCategories={availableCategories}
        defaultCategory="Other"
      />

      {staples.length === 0 && (
        <div className="stock-maintenance">
          <button
            type="button"
            className="tertiary-button"
            onClick={loadStarterStaples}
          >
            Add the app's common recurring buys
          </button>

          <p className="small-text stock-maintenance-note">
            Bulk-adds a starter list of weekly groceries to get you going — tweak
            or remove any you don't need.
          </p>
        </div>
      )}
    </div>
  );
}

export default StaplesList;
