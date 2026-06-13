import InventoryList from "./InventoryList";
import StaplesList from "./StaplesList";

function HouseholdBasics({
  activeSection,
  setActiveSection,
  staples,
  activeStaplesCount,
  inventory,
  activeInventoryCount,
  newStaple,
  setNewStaple,
  addStaple,
  deleteStaple,
  updateStapleFrequency,
  updateStapleCategory,
  updateStapleDetails,
  toggleStapleActive,
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
      <div className="more-tabs household-tabs" aria-label="Household basics">
        <button
          type="button"
          className={activeSection === "recurring" ? "active" : ""}
          onClick={() => setActiveSection("recurring")}
        >
          Recurring buys
        </button>

        <button
          type="button"
          className={activeSection === "stock" ? "active" : ""}
          onClick={() => setActiveSection("stock")}
        >
          Stock
        </button>
      </div>

      <div className="household-summary">
        <div>
          <span>On Woolworths list</span>
          <strong>{activeStaplesCount}</strong>
          <small>of {staples.length} recurring</small>
        </div>

        <div>
          <span>In stock</span>
          <strong>{activeInventoryCount}</strong>
          <small>of {inventory.length} items</small>
        </div>
      </div>

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
