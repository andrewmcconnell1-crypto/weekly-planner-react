import { lazy, Suspense } from "react";

import ErrorBoundary from "./ErrorBoundary";
import PanelError from "./PanelError";

const HouseholdBasics = lazy(() => import("./HouseholdBasics"));
const BasketsPanel = lazy(() => import("./BasketsPanel"));

// Kitchen: the household hub, shown as three top tabs — Stock, Recurring buys,
// Weekly baskets — with a live count on each. Mirrors the Recipes tab's pinned
// segmented sub-nav so the app has one "section with top tabs" pattern.
export default function MoreScreen({
  kitchenSection,
  setKitchenSection,
  availableCategories,
  recipes,
  activeStaplesCount,
  activeInventoryCount,
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
  updateInventorySubcategory,
  toggleInventoryActive,
  loadStarterInventory,
  onOpenStockCatalog,
  ingredientGroups,
  availableGroups,
  updateIngredientGroup,
  baskets,
  setBaskets,
  planWeeks,
  onPlanRecipeOnWeekDay,
}) {
  const tabs = [
    { key: "stock", label: "Stock", count: activeInventoryCount },
    { key: "recurring", label: "Recurring", count: activeStaplesCount },
    { key: "baskets", label: "Baskets", count: baskets.length },
  ];

  // Switching sections starts you at the top, like the Recipes sub-nav.
  function selectSection(next) {
    setKitchenSection(next);
    window.scrollTo(0, 0);
  }

  const isHousehold =
    kitchenSection === "stock" || kitchenSection === "recurring";

  return (
    <section className="screen more-screen">
      <div className="recipes-modes-bar">
        <div
          className="recipes-modes kitchen-modes"
          role="tablist"
          aria-label="Kitchen sections"
        >
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={kitchenSection === tab.key}
              className={`recipes-mode ${
                kitchenSection === tab.key ? "active" : ""
              }`}
              onClick={() => selectSection(tab.key)}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className="recipes-mode-count">{tab.count}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {isHousehold && (
        <ErrorBoundary fallback={(reset) => <PanelError onRetry={reset} />}>
          <Suspense fallback={null}>
            <HouseholdBasics
              activeSection={kitchenSection}
              availableCategories={availableCategories}
              staples={staples}
              inventory={inventory}
              newStaple={newStaple}
              setNewStaple={setNewStaple}
              addStaple={addStaple}
              deleteStaple={deleteStaple}
              updateStapleFrequency={updateStapleFrequency}
              updateStapleCategory={updateStapleCategory}
              updateStapleDetails={updateStapleDetails}
              toggleStapleActive={toggleStapleActive}
              loadStarterStaples={loadStarterStaples}
              newInventoryItem={newInventoryItem}
              setNewInventoryItem={setNewInventoryItem}
              addInventoryItem={addInventoryItem}
              deleteInventoryItem={deleteInventoryItem}
              updateInventoryCategory={updateInventoryCategory}
              updateInventorySubcategory={updateInventorySubcategory}
              toggleInventoryActive={toggleInventoryActive}
              loadStarterInventory={loadStarterInventory}
              onOpenStockCatalog={onOpenStockCatalog}
              ingredientGroups={ingredientGroups}
              availableGroups={availableGroups}
              updateIngredientGroup={updateIngredientGroup}
            />
          </Suspense>
        </ErrorBoundary>
      )}

      {kitchenSection === "baskets" && (
        <ErrorBoundary fallback={(reset) => <PanelError onRetry={reset} />}>
          <Suspense fallback={null}>
            <BasketsPanel
              baskets={baskets}
              setBaskets={setBaskets}
              recipes={recipes}
              staples={staples}
              inventory={inventory}
              ingredientGroups={ingredientGroups}
              planWeeks={planWeeks}
              onPlanRecipeOnWeekDay={onPlanRecipeOnWeekDay}
            />
          </Suspense>
        </ErrorBoundary>
      )}
    </section>
  );
}
