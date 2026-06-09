import { categories } from "../data/categories";

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

      <ul className="staples-list">
        {staples.map((staple) => (
          <li className="card staple-card" key={staple.id}>
            <div className="staple-main">
              <div className="staple-title-row">
                <strong>{staple.name}</strong>

                <label className="active-toggle">
                <input
                  type="checkbox"
                  checked={staple.active}
                  onChange={() => toggleStapleActive(staple.id)}
                />
                Active
                </label>
              </div>

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

              <p className="small-text">
                Starts: {staple.startDate}
              </p>

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
            </div>

            <button
              className="delete-button"
              onClick={() => deleteStaple(staple.id)}
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default StaplesList;
