import InventoryList from "./InventoryList";
import StaplesList from "./StaplesList";

// Renders just one section (recurring buys or stock). Navigation between the two
// lives in the Kitchen overview cards, so this no longer carries its own tab
// switcher or combined summary.
function HouseholdBasics({
  activeSection,
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
}) {
  return (
    <div className="household-basics">
      {activeSection === "recurring" ? (
        <StaplesList
          staples={staples}
          newStaple={newStaple}
          setNewStaple={setNewStaple}
          addStaple={addStaple}
          deleteStaple={deleteStaple}
          updateStapleFrequency={updateStapleFrequency}
          updateStapleCategory={updateStapleCategory}
          updateStapleDetails={updateStapleDetails}
          toggleStapleActive={toggleStapleActive}
          loadStarterStaples={loadStarterStaples}
        />
      ) : (
        <InventoryList
          inventory={inventory}
          newInventoryItem={newInventoryItem}
          setNewInventoryItem={setNewInventoryItem}
          addInventoryItem={addInventoryItem}
          deleteInventoryItem={deleteInventoryItem}
          updateInventoryCategory={updateInventoryCategory}
          toggleInventoryActive={toggleInventoryActive}
          loadStarterInventory={loadStarterInventory}
        />
      )}
    </div>
  );
}

export default HouseholdBasics;
