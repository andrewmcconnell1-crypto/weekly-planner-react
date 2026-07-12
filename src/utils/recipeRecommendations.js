// "More like your top-rated": build a taste profile from the recipes you rated
// highly (4–5 stars), then surface other recipes that share their category and
// tags. Category counts double — it's the strongest "same kind of dish" signal
// (protein / cuisine). Already-rated recipes are excluded so the row is all new
// suggestions. Returns [] when there's nothing rated to learn from.
const MIN_SEED_RATING = 4;
const CATEGORY_WEIGHT = 2;

export function recommendFromRatings(recipes, ratings = {}, { limit = 14 } = {}) {
  const seeds = recipes.filter(
    (recipe) => (ratings[recipe.id] || 0) >= MIN_SEED_RATING
  );
  if (seeds.length === 0) return [];

  const categoryWeight = new Map();
  const tagWeight = new Map();
  for (const recipe of seeds) {
    const weight = ratings[recipe.id];
    if (recipe.category) {
      categoryWeight.set(
        recipe.category,
        (categoryWeight.get(recipe.category) || 0) + weight
      );
    }
    for (const tag of recipe.tags || []) {
      tagWeight.set(tag, (tagWeight.get(tag) || 0) + weight);
    }
  }

  const rated = new Set(Object.keys(ratings));

  return recipes
    .filter((recipe) => !rated.has(recipe.id))
    .map((recipe) => {
      let score = 0;
      if (recipe.category && categoryWeight.has(recipe.category)) {
        score += categoryWeight.get(recipe.category) * CATEGORY_WEIGHT;
      }
      for (const tag of recipe.tags || []) {
        if (tagWeight.has(tag)) score += tagWeight.get(tag);
      }
      return { recipe, score };
    })
    .filter((entry) => entry.score > 0)
    .sort(
      (a, b) =>
        b.score - a.score || a.recipe.name.localeCompare(b.recipe.name)
    )
    .slice(0, limit)
    .map((entry) => entry.recipe);
}
