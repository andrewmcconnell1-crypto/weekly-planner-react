import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

import { categories } from "../data/categories";

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

// Compact row per recurring buy: tick (on the Woolworths list), name and a
// summary line. The rarely-touched details (qty, frequency, category, delete)
// live behind the chevron. Rows are grouped under their category heading, so
// the category isn't repeated on every card.
function StaplesList({
  staples,
  newStaple,
  setNewStaple,
  addStaple,
  deleteStaple,
  updateStapleFrequency,
  updateStapleCategory,
  updateStapleDetails,
  toggleStapleActive,
}) {
  const [expandedStapleId, setExpandedStapleId] = useState(null);
  const groupedStaples = groupByCategory(staples);

  return (
    <div className="staples-panel">
      <div className="add-item-row">
        <input
          type="text"
          placeholder="Add recurring buy..."
          value={newStaple}
          onChange={(event) => setNewStaple(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              addStaple();
            }
          }}
        />

        <button onClick={addStaple}>Add</button>
      </div>

      <p className="small-text staples-hint">
        Ticked items stay on your Woolworths list. Untick one to flag it for
        removal this week.
      </p>

      {groupedStaples.map(([category, items]) => (
        <div className="basics-group" key={category}>
          <p className="basics-group-title">{category}</p>

          <ul className="staples-list">
            {items.map((staple) => {
              const isExpanded = expandedStapleId === staple.id;
              const isOff = staple.active === false;
              const quantityLabel = staple.quantity
                ? `${staple.quantity} ${staple.unit || ""}`.trim()
                : "";
              const summary = [
                quantityLabel,
                frequencyLabels[staple.frequency] || "Weekly",
              ]
                .filter(Boolean)
                .join(" · ");

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

                      <span>{summary}</span>

                      {isOff && (
                        <span className="staple-off-note">
                          Off — flagged on the Shop page to remove from your
                          Woolworths list
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      className="basics-edit-toggle"
                      aria-expanded={isExpanded}
                      aria-label={`Edit ${staple.name}`}
                      onClick={() =>
                        setExpandedStapleId(isExpanded ? null : staple.id)
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
                            updateStapleFrequency(staple.id, event.target.value)
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
                            updateStapleCategory(staple.id, event.target.value)
                          }
                        >
                          {categories.map((category) => (
                            <option key={category} value={category}>
                              {category}
                            </option>
                          ))}
                        </select>
                      </div>

                      <p className="small-text">Starts: {staple.startDate}</p>

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
        </div>
      ))}
    </div>
  );
}

export default StaplesList;
