import { useState } from "react";
import { ChevronDown } from "lucide-react";

const NEW_CATEGORY = "__new__";

// Add row for stock / recurring items: a small card with the name, a category
// picker, and an inline "+ New category…" option that reveals a text field so a
// category can be created on the spot.
function AddItemRow({
  value,
  setValue,
  onAdd,
  label,
  placeholder,
  availableCategories = [],
  defaultCategory,
}) {
  const [category, setCategory] = useState(
    defaultCategory || availableCategories[0] || "Other"
  );
  const [customCategory, setCustomCategory] = useState("");

  const creating = category === NEW_CATEGORY;

  function handleAdd() {
    if (value.trim() === "") return;

    const resolved = creating ? customCategory.trim() : category;
    if (creating && resolved === "") return; // need a name for the new category

    onAdd(resolved);

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
        placeholder={placeholder}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") handleAdd();
        }}
      />

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

      <button type="button" className="add-panel-submit" onClick={handleAdd}>
        Add
      </button>
    </div>
  );
}

export default AddItemRow;
