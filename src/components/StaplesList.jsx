import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

import { categories } from "../data/categories";
import { normaliseItemName } from "../utils/itemUtils";
import AddItemRow from "./AddItemRow";

const frequencyLabels = {
  weekly: "Weekly",
  fortnightly: "Fortnightly",
  "four-weekly": "4-weekly",
  "ad-hoc": "Ad hoc",
};

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
}) {
  const [searchText, setSearchText] = useState("");
  const [openCategories, setOpenCategories] = useState({});
  const [expandedStapleId, setExpandedStapleId] = useState(null);

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

  return (
    <div className="staples-panel">
      <input
        type="text"
        placeholder="Search recurring buys..."
        value={searchText}
        onChange={(event) => setSearchText(event.target.value)}
      />

      <p className="small-text stock-hint">
        Ticked items stay on your Woolworths list. Untick one to flag it for
        removal this week.
      </p>

      {staples.length === 0 ? (
        <p className="empty-state">No recurring buys yet.</p>
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
                  {items.map((staple) => {
                    const isExpanded = expandedStapleId === staple.id;
                    const isOff = staple.active === false;
                    const showFrequency =
                      staple.frequency && staple.frequency !== "weekly";

                    return (
                      <li className="card basics-card" key={staple.id}>
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
                                Off — flagged on the Shop page to remove from
                                your Woolworths list
                              </span>
                            )}
                          </div>

                          <button
                            type="button"
                            className="basics-edit-toggle"
                            aria-expanded={isExpanded}
                            aria-label={`Edit ${staple.name}`}
                            onClick={() =>
                              setExpandedStapleId(
                                isExpanded ? null : staple.id
                              )
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
                            <div className="staple-quantity-row">
                              <input
                                type="number"
                                min="0"
                                step="any"
                                inputMode="decimal"
                                placeholder="Qty"
                                aria-label={`${staple.name} quantity`}
                                value={staple.quantity ?? ""}
                                onChange={(event) =>
                                  updateStapleDetails(staple.id, {
                                    quantity:
                                      event.target.value === ""
                                        ? null
                                        : Number(event.target.value),
                                  })
                                }
                              />

                              <input
                                type="text"
                                placeholder="unit (e.g. pack)"
                                aria-label={`${staple.name} unit`}
                                value={staple.unit || ""}
                                onChange={(event) =>
                                  updateStapleDetails(staple.id, {
                                    unit: event.target.value,
                                  })
                                }
                              />
                            </div>

                            <div className="staple-controls">
                              <select
                                value={staple.frequency}
                                onChange={(event) =>
                                  updateStapleFrequency(
                                    staple.id,
                                    event.target.value
                                  )
                                }
                              >
                                <option value="weekly">Weekly</option>
                                <option value="fortnightly">Fortnightly</option>
                                <option value="four-weekly">4-weekly</option>
                                <option value="ad-hoc">Ad hoc</option>
                              </select>

                              <select
                                value={staple.category || "Other"}
                                onChange={(event) =>
                                  updateStapleCategory(
                                    staple.id,
                                    event.target.value
                                  )
                                }
                              >
                                {availableCategories.map((category) => (
                                  <option key={category} value={category}>
                                    {category}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <p className="small-text">
                              Starts: {staple.startDate}
                            </p>

                            <button
                              className="delete-button"
                              onClick={() => deleteStaple(staple.id)}
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
