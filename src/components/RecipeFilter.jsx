// Horizontal pill filter (category / source / tags) shared by the Recipes tab
// and the meal editor's recipe picker, so both narrow their lists the same way.
// Single-select by default (active is a string); pass `multiple` to allow
// several at once (active is a Set, "All" lights up when nothing is selected).
// Renders nothing when there's only one real option to filter by ("All" + one),
// since the pills couldn't do anything useful then.
function RecipeFilter({
  label,
  options,
  active,
  onSelect,
  multiple = false,
  wrap = false,
}) {
  if (options.length <= 2) return null;

  const isActive = (option) => {
    if (!multiple) return active === option;
    if (option === "All") return active.size === 0;
    return active.has(option);
  };

  return (
    <div className={`recipe-filter-group ${wrap ? "recipe-filter-group-wrap" : ""}`}>
      <p className="recipe-filter-label">{label}</p>

      <div
        className={`recipe-filter-chips ${wrap ? "recipe-filter-chips-wrap" : ""}`}
        aria-label={`Filter by ${label.toLowerCase()}`}
      >
        {options.map((option) => (
          <button
            key={option}
            type="button"
            className={isActive(option) ? "active" : ""}
            aria-pressed={multiple ? isActive(option) : undefined}
            onClick={() => onSelect(option)}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

export default RecipeFilter;
