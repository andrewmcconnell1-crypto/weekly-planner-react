// A titled, horizontally-scrolling strip of recipe tiles for the "For you"
// discovery feed. Renders nothing when it has no children, so callers can pass
// a possibly-empty row without guarding.
function RecipeRow({ title, subtitle, children }) {
  const items = Array.isArray(children) ? children.filter(Boolean) : children;
  if (Array.isArray(items) && items.length === 0) return null;

  return (
    <section className="recipe-row-section">
      <div className="recipe-row-head">
        <h2 className="recipe-row-title">{title}</h2>
        {subtitle && <p className="recipe-row-sub small-text">{subtitle}</p>}
      </div>

      <div className="recipe-row-scroller">{items}</div>
    </section>
  );
}

export default RecipeRow;
