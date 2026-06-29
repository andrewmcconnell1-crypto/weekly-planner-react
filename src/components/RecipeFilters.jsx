import RecipeFilter from "./RecipeFilter";

// The Category / Tags / Source filter rows, driven by a useRecipeFilters object.
// Shared by the Recipes tab and the meal editor's picker so they match.
function RecipeFilters({ filters }) {
  return (
    <div className="recipe-filters">
      <RecipeFilter
        label="Category"
        options={filters.categories}
        active={filters.activeCategory}
        onSelect={filters.setActiveCategory}
      />

      <RecipeFilter
        label="Tags"
        options={filters.tags}
        active={filters.activeTags}
        onSelect={filters.toggleTag}
        multiple
      />

      <RecipeFilter
        label="Source"
        options={filters.sources}
        active={filters.activeSource}
        onSelect={filters.setActiveSource}
      />
    </div>
  );
}

export default RecipeFilters;
