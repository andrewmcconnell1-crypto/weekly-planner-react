import { useState } from "react";

import {
  groupRecipesByCategory,
  recipeProvenance,
  recipeTags,
} from "../utils/recipeUtils";

// Display label used everywhere for a recipe's origin — Bistro / Bistro+ for the
// app's own, the publication name for sourced ones.
const sourceLabel = (recipe) => recipeProvenance(recipe).label;

const SOURCE_ORDER = ["Bistro", "Bistro+", "RecipeTin Eats", "Your recipe"];

// Shared recipe search + filter state (category / tags / source) so the Recipes
// tab and the meal editor's picker narrow their lists identically. Returns the
// already-filtered, category-ordered list plus the option lists and setters.
// Toggle an option in/out of a Set-backed filter. "All" clears the selection;
// an empty Set means "All". Shared by category / source / tags so every pill
// menu is multi-select.
function makeToggle(setter) {
  return (option) => {
    if (option === "All") {
      setter(new Set());
      return;
    }
    setter((prev) => {
      const next = new Set(prev);
      if (next.has(option)) next.delete(option);
      else next.add(option);
      return next;
    });
  };
}

export function useRecipeFilters(recipes) {
  const [searchText, setSearchText] = useState("");
  // Every pill menu is multi-select: an empty Set means "All". Category and
  // source match by OR (any selected); tags by AND (must have all selected).
  const [activeCategories, setActiveCategories] = useState(() => new Set());
  const [activeSources, setActiveSources] = useState(() => new Set());
  const [activeTags, setActiveTags] = useState(() => new Set());

  // Grouped only to get a sensible category order + name sort; rendered flat.
  const recipeGroups = groupRecipesByCategory(recipes);
  const categories = ["All", ...recipeGroups.map((group) => group.category)];
  const allRecipes = recipeGroups.flatMap((group) => group.recipes);

  const distinctSources = [...new Set(recipes.map(sourceLabel))].sort(
    (a, b) => {
      const aIndex = SOURCE_ORDER.indexOf(a);
      const bIndex = SOURCE_ORDER.indexOf(b);
      if (aIndex === -1 && bIndex === -1) return a.localeCompare(b);
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
    }
  );
  const sources = ["All", ...distinctSources];

  // Tags actually present, in the master order (Vegetarian is already a category).
  const presentTags = new Set(recipes.flatMap((recipe) => recipe.tags || []));
  const distinctTags = recipeTags.filter(
    (tag) => tag !== "Vegetarian" && presentTags.has(tag)
  );
  const tags = ["All", ...distinctTags];

  const cleanedSearch = searchText.trim().toLowerCase();
  const selectedTags = [...activeTags];

  const visibleRecipes = allRecipes.filter((recipe) => {
    const inCategory =
      activeCategories.size === 0 ||
      activeCategories.has(recipe.category || "Other");
    const inSource =
      activeSources.size === 0 ||
      activeSources.has(sourceLabel(recipe));
    const recipeTagList = recipe.tags || [];
    const inTag = selectedTags.every((tag) => recipeTagList.includes(tag));

    if (!inCategory || !inSource || !inTag) return false;
    if (!cleanedSearch) return true;

    return `${recipe.name} ${recipe.category} ${recipe.source || ""}`
      .toLowerCase()
      .includes(cleanedSearch);
  });

  const toggleCategory = makeToggle(setActiveCategories);
  const toggleSource = makeToggle(setActiveSources);
  const toggleTag = makeToggle(setActiveTags);

  function clearFilters() {
    setSearchText("");
    setActiveCategories(new Set());
    setActiveSources(new Set());
    setActiveTags(new Set());
  }

  // Active filters (excluding the search box), for the "Filters (N)" badge.
  const activeFilterCount =
    activeCategories.size + activeSources.size + activeTags.size;

  return {
    activeFilterCount,
    searchText,
    setSearchText,
    activeCategories,
    toggleCategory,
    activeSources,
    toggleSource,
    activeTags,
    toggleTag,
    categories,
    sources,
    tags,
    visibleRecipes,
    clearFilters,
  };
}
