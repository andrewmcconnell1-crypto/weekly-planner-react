import DishGlyph from "./DishGlyph";

// Recipe tile: a gradient keyed to the category tone with a hand-drawn dish
// glyph. `size` is "sm" (card thumbnail) or "lg" (detail hero).
function RecipeThumb({ imagery, size = "sm" }) {
  return (
    <span
      className={`recipe-thumb recipe-thumb-${size} recipe-thumb-placeholder`}
      style={{ background: imagery.gradient }}
      aria-hidden="true"
    >
      <DishGlyph glyph={imagery.glyph} className="recipe-thumb-glyph" />
    </span>
  );
}

export default RecipeThumb;
