import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

import { useDialogFocus } from "../hooks/useDialogFocus";
import RecipeFilter from "./RecipeFilter";

// Bottom sheet holding the recipe Category / Tags / Source filters, laid out
// fully (wrapped, nothing hidden off-screen). Driven by a useRecipeFilters
// object, so toggling updates the list behind it live; the footer shows the
// live result count and closes.
function RecipeFilterSheet({ filters, onClose }) {
  const [closing, setClosing] = useState(false);
  const closeTimerRef = useRef(null);
  const dialogRef = useRef(null);

  useDialogFocus(dialogRef);

  function requestClose() {
    if (closeTimerRef.current) return;
    setClosing(true);
    closeTimerRef.current = window.setTimeout(onClose, 220);
  }

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKey(event) {
      if (event.key === "Escape") requestClose();
    }

    window.addEventListener("keydown", handleKey);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onClose]);

  useEffect(() => () => window.clearTimeout(closeTimerRef.current), []);

  const resultCount = filters.visibleRecipes.length;

  return (
    <div
      className={`sheet-backdrop ${closing ? "closing" : ""}`}
      role="presentation"
      onClick={requestClose}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        className={`sheet ${closing ? "closing" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Filter recipes"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="sheet-header">
          <div className="sheet-title">
            <strong>Filters</strong>
            <span>Narrow your recipes</span>
          </div>

          <button
            type="button"
            className="sheet-close"
            aria-label="Close"
            onClick={requestClose}
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        <div className="sheet-body recipe-filter-sheet-body">
          <RecipeFilter
            label="Category"
            options={filters.categories}
            active={filters.activeCategory}
            onSelect={filters.setActiveCategory}
            wrap
          />

          <RecipeFilter
            label="Tags"
            options={filters.tags}
            active={filters.activeTags}
            onSelect={filters.toggleTag}
            multiple
            wrap
          />

          <RecipeFilter
            label="Source"
            options={filters.sources}
            active={filters.activeSource}
            onSelect={filters.setActiveSource}
            wrap
          />
        </div>

        <div className="sheet-footer">
          <button
            type="button"
            className="secondary"
            disabled={filters.activeFilterCount === 0}
            onClick={filters.clearFilters}
          >
            Clear all
          </button>

          <button
            type="button"
            className="primary-button"
            onClick={requestClose}
          >
            Show {resultCount} {resultCount === 1 ? "recipe" : "recipes"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default RecipeFilterSheet;
