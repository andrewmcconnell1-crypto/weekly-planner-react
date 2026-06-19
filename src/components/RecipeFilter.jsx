// Horizontal pill filter (category / source) shared by the Recipes tab and the
// meal editor's recipe picker, so both narrow their lists the same way. Renders
// nothing when there's only one real option to filter by ("All" + one), since
// the pills couldn't do anything useful then.
function RecipeFilter({ label, options, active, onSelect }) {
  if (options.length <= 2) return null;

  return (
    <div className="recipe-filter-group">
      <p className="recipe-filter-label">{label}</p>

      <div
        className="recipe-filter-chips"
        aria-label={`Filter by ${label.toLowerCase()}`}
      >
        {options.map((option) => (
          <button
            key={option}
            type="button"
            className={active === option ? "active" : ""}
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
