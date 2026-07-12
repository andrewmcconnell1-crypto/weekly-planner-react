import { useId, useState } from "react";
import { ChevronDown } from "lucide-react";

const NEW_CATEGORY = "__new__";

// Add row for stock / recurring / shopping items: a small card with the name, a
// category picker (with an inline "+ New category…" option), and — when
// priorityOptions are given — a priority picker. onAdd receives (category,
// priority, subcategory); priority is undefined when no priority picker is
// shown, and subcategory is undefined unless a subgroup is picked. A subgroup
// picker appears only while the chosen category equals subcategoryCategory.
function AddItemRow({
  value,
  setValue,
  onAdd,
  label,
  placeholder,
  availableCategories = [],
  defaultCategory,
  priorityOptions = null,
  defaultPriority,
  suggestions = null,
  subcategoryOptions = null,
  subcategoryCategory = null,
}) {
  const suggestionsId = useId();
  const [category, setCategory] = useState(
    defaultCategory || availableCategories[0] || "Other"
  );
  const [customCategory, setCustomCategory] = useState("");
  const [priority, setPriority] = useState(
    defaultPriority || priorityOptions?.[0]?.value || ""
  );
  const [subcategory, setSubcategory] = useState("");
  const [status, setStatus] = useState(null);

  const creating = category === NEW_CATEGORY;
  // Subgroups only apply to the one subdivided aisle (Pantry) — hide the picker
  // for any other category so the row stays uncluttered.
  const showSubcategory =
    subcategoryOptions && category === subcategoryCategory;

  function handleAdd() {
    if (value.trim() === "") return;

    const resolved = creating ? customCategory.trim() : category;
    if (creating && resolved === "") return; // need a name for the new category

    const result = onAdd(
      resolved,
      priorityOptions ? priority : undefined,
      showSubcategory ? subcategory : undefined
    );

    // onAdd may return "updated" when the item was already on the list and got
    // re-prioritised — confirm that so it doesn't feel like nothing happened.
    if (result === "updated" && priorityOptions) {
      const label =
        priorityOptions.find((option) => option.value === priority)?.label ||
        "your list";
      setStatus(`Moved “${value.trim()}” to ${label}.`);
    } else {
      setStatus(null);
    }

    if (creating) {
      // Keep the just-created category selected for the next add.
      setCategory(resolved);
      setCustomCategory("");
    }
  }

  return (
    <div className="add-panel">
      {label && <p className="section-kicker">{label}</p>}

      <input
        type="text"
        className="add-panel-name"
        aria-label={label || placeholder}
        placeholder={placeholder}
        value={value}
        list={suggestions ? suggestionsId : undefined}
        onChange={(event) => {
          setValue(event.target.value);
          if (status) setStatus(null);
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter") handleAdd();
        }}
      />

      {suggestions && (
        <datalist id={suggestionsId}>
          {suggestions.map((name) => (
            <option key={name} value={name} />
          ))}
        </datalist>
      )}

      {status && <p className="add-panel-status small-text">{status}</p>}

      <div className="add-field">
        <span className="add-field-label">Category</span>

        <div className="select-wrap">
          <select
            aria-label="Category"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          >
            {availableCategories.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
            <option value={NEW_CATEGORY}>+ New category…</option>
          </select>

          <ChevronDown
            size={18}
            className="select-chevron"
            aria-hidden="true"
          />
        </div>

        {creating && (
          <input
            type="text"
            placeholder="New category name"
            value={customCategory}
            autoFocus
            onChange={(event) => setCustomCategory(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") handleAdd();
            }}
          />
        )}
      </div>

      {showSubcategory && (
        <div className="add-field">
          <span className="add-field-label">Subgroup</span>

          <div className="select-wrap">
            <select
              aria-label="Subgroup"
              value={subcategory}
              onChange={(event) => setSubcategory(event.target.value)}
            >
              <option value="">Auto (by name)</option>
              {subcategoryOptions.map((option) => (
                <option key={option.key} value={option.key}>
                  {option.label}
                </option>
              ))}
            </select>

            <ChevronDown
              size={18}
              className="select-chevron"
              aria-hidden="true"
            />
          </div>
        </div>
      )}

      {priorityOptions && (
        <div className="add-field">
          <span className="add-field-label">Priority</span>

          <div className="select-wrap">
            <select
              aria-label="Priority"
              value={priority}
              onChange={(event) => setPriority(event.target.value)}
            >
              {priorityOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <ChevronDown
              size={18}
              className="select-chevron"
              aria-hidden="true"
            />
          </div>
        </div>
      )}

      <button type="button" className="add-panel-submit" onClick={handleAdd}>
        Add
      </button>
    </div>
  );
}

export default AddItemRow;
