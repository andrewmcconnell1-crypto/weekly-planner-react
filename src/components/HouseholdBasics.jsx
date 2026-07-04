import { useState } from "react";

import InventoryList from "./InventoryList";
import StaplesList from "./StaplesList";

// Renders just one section (recurring buys or stock). Navigation between the two
// lives in the Kitchen overview cards, so this no longer carries its own tab
// switcher or combined summary.
function HouseholdBasics({
  activeSection,
  availableCategories,
  staples,
  inventory,
  newStaple,
  setNewStaple,
  addStaple,
  deleteStaple,
  updateStapleFrequency,
  updateStapleCategory,
  updateStapleDetails,
  toggleStapleActive,
  loadStarterStaples,
  newInventoryItem,
  setNewInventoryItem,
  addInventoryItem,
  deleteInventoryItem,
  updateInventoryCategory,
  toggleInventoryActive,
  loadStarterInventory,
  onOpenStockCatalog,
  ingredientGroups,
  availableGroups,
  updateIngredientGroup,
}) {
  const activeStaplesCount = staples.filter(
    (staple) => staple.active !== false
  ).length;
  const activeInventoryCount = inventory.filter(
    (item) => item.active !== false
  ).length;

  // Tap a summary card to filter the list to just those items. "active" =
  // in-stock / on-list; "inactive" = missing / flagged off. null = show all.
  const [statusFilter, setStatusFilter] = useState(null);

  // Each section has its own active/inactive meaning, so clear the filter when
  // switching between Stock and Recurring — reset during render (React's
  // recommended pattern) rather than in an effect.
  const [prevSection, setPrevSection] = useState(activeSection);
  if (activeSection !== prevSection) {
    setPrevSection(activeSection);
    setStatusFilter(null);
  }

  const toggleFilter = (value) =>
    setStatusFilter((current) => (current === value ? null : value));

  const filterNote =
    statusFilter === null
      ? null
      : activeSection === "recurring"
        ? statusFilter === "inactive"
          ? "Showing items flagged to remove"
          : "Showing items on your list"
        : statusFilter === "inactive"
          ? "Showing missing items"
          : "Showing in-stock items";

  const inactiveInventory = inventory.length - activeInventoryCount;
  const inactiveStaples = staples.length - activeStaplesCount;

  return (
    <div className="household-basics">
      {activeSection === "recurring" ? (
        <div className="section-summary">
          <button
            type="button"
            className={`section-summary-card ${
              statusFilter === "active" ? "is-selected" : ""
            }`}
            aria-pressed={statusFilter === "active"}
            disabled={activeStaplesCount === 0}
            onClick={() => toggleFilter("active")}
          >
            <span>On list</span>
            <strong>{activeStaplesCount}</strong>
            <small>of {staples.length} recurring</small>
          </button>

          <button
            type="button"
            className={`section-summary-card ${
              statusFilter === "inactive" ? "is-selected" : ""
            }`}
            aria-pressed={statusFilter === "inactive"}
            disabled={inactiveStaples === 0}
            onClick={() => toggleFilter("inactive")}
          >
            <span>Off</span>
            <strong>{inactiveStaples}</strong>
            <small>flagged to remove</small>
          </button>
        </div>
      ) : (
        <div className="section-summary">
          <button
            type="button"
            className={`section-summary-card ${
              statusFilter === "active" ? "is-selected" : ""
            }`}
            aria-pressed={statusFilter === "active"}
            disabled={activeInventoryCount === 0}
            onClick={() => toggleFilter("active")}
          >
            <span>In stock</span>
            <strong>{activeInventoryCount}</strong>
            <small>of {inventory.length} items</small>
          </button>

          <button
            type="button"
            className={`section-summary-card ${
              statusFilter === "inactive" ? "is-selected" : ""
            }`}
            aria-pressed={statusFilter === "inactive"}
            disabled={inactiveInventory === 0}
            onClick={() => toggleFilter("inactive")}
          >
            <span>Missing</span>
            <strong>{inactiveInventory}</strong>
            <small>to restock</small>
          </button>
        </div>
      )}

      {filterNote && (
        <p className="section-filter-note">
          <span>{filterNote}</span>
          <button
            type="button"
            className="section-filter-clear"
            onClick={() => setStatusFilter(null)}
          >
            Show all
          </button>
        </p>
      )}

      {activeSection === "recurring" ? (
        <StaplesList
          staples={staples}
          statusFilter={statusFilter}
          availableCategories={availableCategories}
          newStaple={newStaple}
          setNewStaple={setNewStaple}
          addStaple={addStaple}
          deleteStaple={deleteStaple}
          updateStapleFrequency={updateStapleFrequency}
          updateStapleCategory={updateStapleCategory}
          updateStapleDetails={updateStapleDetails}
          toggleStapleActive={toggleStapleActive}
          loadStarterStaples={loadStarterStaples}
          ingredientGroups={ingredientGroups}
          availableGroups={availableGroups}
          updateIngredientGroup={updateIngredientGroup}
        />
      ) : (
        <InventoryList
          inventory={inventory}
          statusFilter={statusFilter}
          availableCategories={availableCategories}
          newInventoryItem={newInventoryItem}
          setNewInventoryItem={setNewInventoryItem}
          addInventoryItem={addInventoryItem}
          deleteInventoryItem={deleteInventoryItem}
          updateInventoryCategory={updateInventoryCategory}
          toggleInventoryActive={toggleInventoryActive}
          loadStarterInventory={loadStarterInventory}
          onOpenStockCatalog={onOpenStockCatalog}
          ingredientGroups={ingredientGroups}
          availableGroups={availableGroups}
          updateIngredientGroup={updateIngredientGroup}
        />
      )}
    </div>
  );
}

export default HouseholdBasics;
