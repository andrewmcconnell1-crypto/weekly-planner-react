// Recipe tile: a gradient keyed to the category tone with a dish emoji. `size`
// is "sm" (card thumbnail) or "lg" (detail hero).
function RecipeThumb({ imagery, size = "sm" }) {
  return (
    <span
      className={`recipe-thumb recipe-thumb-${size} recipe-thumb-placeholder`}
      style={{ background: imagery.gradient }}
      aria-hidden="true"
    >
      <span className="recipe-thumb-emoji">{imagery.emoji}</span>
    </span>
  );
}

export default RecipeThumb;
