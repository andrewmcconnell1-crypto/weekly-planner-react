import { useState } from "react";

import {
  groupRecipesByCategory,
  recipeSourceLabel,
  recipeTags,
} from "../utils/recipeUtils";

const SOURCE_ORDER = ["RecipeTin Eats", "Original recipes", "Custom"];

// Shared recipe search + filter state (category / tags / source) so the Recipes
// tab and the meal editor's picker narrow their lists identically. Returns the
// already-filtered, category-ordered list plus the option lists and setters.
export function useRecipeFilters(recipes) {
  const [searchText, setSearchText] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeSource, setActiveSource] = useState("All");
  // Tags are multi-select (AND): an empty Set means "All".
  const [activeTags, setActiveTags] = useState(() => new Set());

  // Grouped only to get a sensible category order + name sort; rendered flat.
  const recipeGroups = groupRecipesByCategory(recipes);
  const categories = ["All", ...recipeGroups.map((group) => group.category)];
  const allRecipes = recipeGroups.flatMap((group) => group.recipes);

  const distinctSources = [...new Set(recipes.map(recipeSourceLabel))].sort(
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
  const categoryIsAvailable =
    activeCategory === "All" || categories.includes(activeCategory);
  const sourceIsAvailable =
    activeSource === "All" || sources.includes(activeSource);
  const selectedTags = [...activeTags];

  const visibleRecipes = allRecipes.filter((recipe) => {
    const inCategory =
      !categoryIsAvailable ||
      activeCategory === "All" ||
      (recipe.category || "Other") === activeCategory;
    const inSource =
      !sourceIsAvailable ||
      activeSource === "All" ||
      recipeSourceLabel(recipe) === activeSource;
    const recipeTagList = recipe.tags || [];
    const inTag = selectedTags.every((tag) => recipeTagList.includes(tag));

    if (!inCategory || !inSource || !inTag) return false;
    if (!cleanedSearch) return true;

    return `${recipe.name} ${recipe.category} ${recipe.source || ""}`
      .toLowerCase()
      .includes(cleanedSearch);
  });

  // "All" clears the selection; any other chip toggles in/out of the Set.
  function toggleTag(option) {
    if (option === "All") {
      setActiveTags(new Set());
      return;
    }
    setActiveTags((prev) => {
      const next = new Set(prev);
      if (next.has(option)) next.delete(option);
      else next.add(option);
      return next;
    });
  }

  function clearFilters() {
    setSearchText("");
    setActiveCategory("All");
    setActiveSource("All");
    setActiveTags(new Set());
  }

  return {
    searchText,
    setSearchText,
    activeCategory,
    setActiveCategory,
    activeSource,
    setActiveSource,
    activeTags,
    toggleTag,
    categories,
    sources,
    tags,
    visibleRecipes,
    clearFilters,
  };
}
