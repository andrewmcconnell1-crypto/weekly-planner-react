import {
  getRecipeTone,
  recipeSourceKind,
  recipeSourceLabel,
} from "../utils/recipeUtils";

// One recipe row, shared by the Recipes manager and the meal editor's picker so
// they look identical. `active` highlights the currently-selected recipe.
function RecipeCard({ recipe, active = false, onClick }) {
  return (
    <button
      type="button"
      className={`recipe-row ${active ? "active" : ""}`}
      data-tone={getRecipeTone(recipe.category)}
      onClick={onClick}
    >
      <span className="recipe-row-main">
        <strong>{recipe.name}</strong>
        <span>
          {recipe.category || "Uncategorised"}
          {recipe.serves ? ` · Serves ${recipe.serves}` : ""}
        </span>
      </span>

      <span className="recipe-source" data-source={recipeSourceKind(recipe)}>
        {recipeSourceLabel(recipe)}
      </span>

      <span className="recipe-row-chevron">›</span>
    </button>
  );
}

export default RecipeCard;
