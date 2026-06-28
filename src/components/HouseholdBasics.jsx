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

  return (
    <div className="household-basics">
      {activeSection === "recurring" ? (
        <div className="section-summary">
          <div>
            <span>On list</span>
            <strong>{activeStaplesCount}</strong>
            <small>of {staples.length} recurring</small>
          </div>

          <div>
            <span>Off</span>
            <strong>{staples.length - activeStaplesCount}</strong>
            <small>flagged to remove</small>
          </div>
        </div>
      ) : (
        <div className="section-summary">
          <div>
            <span>In stock</span>
            <strong>{activeInventoryCount}</strong>
            <small>of {inventory.length} items</small>
          </div>

          <div>
            <span>Missing</span>
            <strong>{inventory.length - activeInventoryCount}</strong>
            <small>to restock</small>
          </div>
        </div>
      )}

      {activeSection === "recurring" ? (
        <StaplesList
          staples={staples}
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
