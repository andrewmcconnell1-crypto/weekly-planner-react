import { useState } from "react";

const NEW_CATEGORY = "__new__";

// Add row for stock / recurring items: name + a category picker. The picker
// lists the available categories plus a "+ New category…" option that reveals a
// text field, so a category can be created inline if none fits.
function AddItemRow({
  value,
  setValue,
  onAdd,
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
    <div className="basics-add">
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") handleAdd();
        }}
      />

      <div className="basics-add-controls">
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

        <button type="button" onClick={handleAdd}>
          Add
        </button>
      </div>
    </div>
  );
}

export default AddItemRow;
