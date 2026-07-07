import { lazy, Suspense } from "react";
import {
  BookOpen,
  Repeat2,
  Package,
  ShoppingBasket,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import ErrorBoundary from "./ErrorBoundary";
import PanelError from "./PanelError";

const HouseholdBasics = lazy(() => import("./HouseholdBasics"));
const RecipesList = lazy(() => import("./RecipesList"));
const BasketsPanel = lazy(() => import("./BasketsPanel"));

export default function MoreScreen({
  moreSection,
  setMoreSection,
  householdSection,
  openHousehold,
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
  toggleInventoryActive,
  loadStarterInventory,
  onOpenStockCatalog,
  ingredientGroups,
  availableGroups,
  updateIngredientGroup,
  newRecipeName,
  setNewRecipeName,
  addRecipe,
  addImportedRecipe,
  deleteRecipe,
  addIngredientToRecipe,
  deleteIngredientFromRecipe,
  updateRecipe,
  baskets,
  setBaskets,
}) {
  return (
    <section className="screen more-screen">
      {moreSection === "overview" ? (
        <>
          <p className="more-intro">
            Set up the recipes, groceries and stock behind your plan.
          </p>

          <div className="manager-list">
            <button
              className="manager-row"
              type="button"
              onClick={() => setMoreSection("recipes")}
            >
              <span className="manager-icon" aria-hidden="true">
                <BookOpen size={20} strokeWidth={2} />
              </span>
              <span className="manager-main">
                <strong>Recipes</strong>
                <span>
                  {recipes.length} saved recipe
                  {recipes.length === 1 ? "" : "s"}
                </span>
              </span>
              <ChevronRight className="home-step-chevron" size={20} aria-hidden="true" />
            </button>

            <button
              className="manager-row"
              type="button"
              onClick={() => openHousehold("recurring")}
            >
              <span className="manager-icon" aria-hidden="true">
                <Repeat2 size={20} strokeWidth={2} />
              </span>
              <span className="manager-main">
                <strong>Recurring buys</strong>
                <span>{activeStaplesCount} on your list</span>
              </span>
              <ChevronRight className="home-step-chevron" size={20} aria-hidden="true" />
            </button>

            <button
              className="manager-row"
              type="button"
              onClick={() => openHousehold("stock")}
            >
              <span className="manager-icon" aria-hidden="true">
                <Package size={20} strokeWidth={2} />
              </span>
              <span className="manager-main">
                <strong>Stock</strong>
                <span>{activeInventoryCount} in stock</span>
              </span>
              <ChevronRight className="home-step-chevron" size={20} aria-hidden="true" />
            </button>

            <button
              className="manager-row"
              type="button"
              onClick={() => setMoreSection("baskets")}
            >
              <span className="manager-icon" aria-hidden="true">
                <ShoppingBasket size={20} strokeWidth={2} />
              </span>
              <span className="manager-main">
                <strong>Weekly baskets</strong>
                <span>
                  {baskets.length === 0
                    ? "Standing shop lists — see what they cook"
                    : `${baskets.length} saved · see what they cook`}
                </span>
              </span>
              <ChevronRight className="home-step-chevron" size={20} aria-hidden="true" />
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="screen-header">
            <div>
              <h2>
                {moreSection === "household"
                  ? householdSection === "recurring"
                    ? "Recurring buys"
                    : "Stock"
                  : moreSection === "baskets"
                    ? "Weekly baskets"
                    : "Recipes"}
              </h2>
            </div>
          </div>

          <button
            className="back-button"
            type="button"
            onClick={() => setMoreSection("overview")}
          >
            <ChevronLeft size={18} aria-hidden="true" />
            Back to Kitchen
          </button>

          {moreSection === "household" && (
            <ErrorBoundary fallback={(reset) => <PanelError onRetry={reset} />}>
            <Suspense fallback={null}>
              <HouseholdBasics
                activeSection={householdSection}
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

          {moreSection === "baskets" && (
            <ErrorBoundary fallback={(reset) => <PanelError onRetry={reset} />}>
            <Suspense fallback={null}>
              <BasketsPanel
                baskets={baskets}
                setBaskets={setBaskets}
                recipes={recipes}
                staples={staples}
                inventory={inventory}
                ingredientGroups={ingredientGroups}
              />
            </Suspense>
            </ErrorBoundary>
          )}

          {moreSection === "recipes" && (
            <ErrorBoundary fallback={(reset) => <PanelError onRetry={reset} />}>
            <Suspense fallback={null}>
              <RecipesList
                recipes={recipes}
                newRecipeName={newRecipeName}
                setNewRecipeName={setNewRecipeName}
                addRecipe={addRecipe}
                addImportedRecipe={addImportedRecipe}
                deleteRecipe={deleteRecipe}
                addIngredientToRecipe={addIngredientToRecipe}
                deleteIngredientFromRecipe={deleteIngredientFromRecipe}
                updateRecipe={updateRecipe}
                ingredientGroups={ingredientGroups}
                availableGroups={availableGroups}
                updateIngredientGroup={updateIngredientGroup}
              />
            </Suspense>
            </ErrorBoundary>
          )}
        </>
      )}
    </section>
  );
}
