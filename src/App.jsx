import { useMemo, useState } from "react";
import "./App.css";

import HouseholdBasics from "./components/HouseholdBasics";
import MealCard from "./components/MealCard";
import MealEditorSheet from "./components/MealEditorSheet";
import ShoppingList from "./components/ShoppingList";
import WeekControls from "./components/WeekControls";
import RecipesList from "./components/RecipesList";
import SettingsPanel from "./components/SettingsPanel";
import SignInScreen from "./components/SignInScreen";

import { createEmptyMeals, days } from "./utils/mealUtils";
import {
  getSunday,
  getNextSunday,
  formatDate,
  getWeekKey,
} from "./utils/dateUtils";
import { normaliseItemName, createCollectionId } from "./utils/itemUtils";
import { createMealHelpers } from "./utils/mealPlanning";
import {
  buildShoppingPlan,
  generatedShoppingSources,
  getGeneratedShoppingSignature,
} from "./utils/shoppingPlan";
import {
  createStarterInventoryItems,
  normaliseInventoryItems,
  mergeSavedRecipes,
} from "./utils/dataLoaders";
import { isSupabaseConfigured } from "./lib/supabase";
import { useAuth } from "./hooks/useAuth";
import { usePlannerStore } from "./hooks/usePlannerStore";

function LoadingScreen({ message }) {
  return (
    <main className="app-shell tab-home auth-shell">
      <section className="auth-card">
        <p className="small-text">{message}</p>
      </section>
    </main>
  );
}

function App() {
  const [activeTab, setActiveTab] = useState("home");
  const [moreSection, setMoreSection] = useState("overview");
  const [householdSection, setHouseholdSection] = useState("stock");
  const [expandedMealDay, setExpandedMealDay] = useState(null);

  const [currentWeekStart] = useState(getSunday);
  const [nextWeekStart] = useState(getNextSunday);
  const [mealWeekStart, setMealWeekStart] = useState(getNextSunday);
  const [shoppingWeekStart, setShoppingWeekStart] = useState(getNextSunday);

  const { user, loading: authLoading, signInWithGoogle, signOut } = useAuth();
  const {
    mealsByWeek,
    setMealsByWeek,
    shoppingItemsByWeek,
    setShoppingItemsByWeek,
    shoppingListMetaByWeek,
    setShoppingListMetaByWeek,
    staples,
    setStaples,
    inventory,
    setInventory,
    recipes,
    setRecipes,
    loading: dataLoading,
    syncError,
    cloud,
  } = usePlannerStore(user);

  const [newItem, setNewItem] = useState("");
  const [newStaple, setNewStaple] = useState("");
  const [newInventoryItem, setNewInventoryItem] = useState("");
  const [newRecipeName, setNewRecipeName] = useState("");

  const mealHelpers = useMemo(() => createMealHelpers(recipes), [recipes]);
  const { getMealSummary } = mealHelpers;

  // ---- Auth / loading gates (after all hooks, before any data-derived work) ----
  if (isSupabaseConfigured && authLoading) {
    return <LoadingScreen message="Loading…" />;
  }

  if (isSupabaseConfigured && !user) {
    return <SignInScreen onSignIn={signInWithGoogle} />;
  }

  if (dataLoading) {
    return <LoadingScreen message="Loading your plan…" />;
  }

  const mealWeekKey = getWeekKey(mealWeekStart);
  const shoppingWeekKey = getWeekKey(shoppingWeekStart);
  const currentWeekKey = getWeekKey(currentWeekStart);
  const nextWeekKey = getWeekKey(nextWeekStart);
  const homeWeekMode =
    mealWeekKey === currentWeekKey && shoppingWeekKey === currentWeekKey
      ? "current"
      : mealWeekKey === nextWeekKey && shoppingWeekKey === nextWeekKey
        ? "next"
        : "custom";
  const mealWeekMode =
    mealWeekKey === currentWeekKey
      ? "current"
      : mealWeekKey === nextWeekKey
        ? "next"
        : "custom";
  const shoppingWeekMode =
    shoppingWeekKey === currentWeekKey
      ? "current"
      : shoppingWeekKey === nextWeekKey
        ? "next"
        : "custom";

  const meals = mealsByWeek[mealWeekKey] || createEmptyMeals();
  const shoppingWeekMeals =
    mealsByWeek[shoppingWeekKey] || createEmptyMeals();
  const shoppingItems = shoppingItemsByWeek[shoppingWeekKey] || [];

  const mealWeekEnd = new Date(mealWeekStart);
  mealWeekEnd.setDate(mealWeekStart.getDate() + 6);

  const shoppingWeekEnd = new Date(shoppingWeekStart);
  shoppingWeekEnd.setDate(shoppingWeekStart.getDate() + 6);

  const planningDaySummaries = days.map((day) =>
    getMealSummary(day, meals[day], meals)
  );
  const mealsPlannedCount = planningDaySummaries.filter(
    (daySummary) => daySummary.hasMeal
  ).length;

  // Details for the day whose editor sheet is open (if any).
  const expandedDayIndex = expandedMealDay ? days.indexOf(expandedMealDay) : -1;
  const expandedMeal = expandedMealDay ? meals[expandedMealDay] : null;
  const expandedDaySummary = expandedMealDay
    ? getMealSummary(expandedMealDay, expandedMeal, meals)
    : null;
  const expandedNextDay =
    expandedDayIndex >= 0 ? days[expandedDayIndex + 1] : undefined;
  let expandedDayLabel = "";
  if (expandedDayIndex >= 0) {
    const expandedDate = new Date(mealWeekStart);
    expandedDate.setDate(mealWeekStart.getDate() + expandedDayIndex);
    expandedDayLabel = formatDate(expandedDate);
  }

  const activeStaplesCount = staples.filter(
    (staple) => staple.active !== false
  ).length;

  const activeInventoryCount = inventory.filter(
    (item) => item.active !== false
  ).length;
  const visibleShoppingItems = shoppingItems.filter(
    (item) => item.source !== "Recurring buy"
  );
  const shoppingItemsCount = visibleShoppingItems.length;
  const pendingShoppingItemsCount = visibleShoppingItems.filter(
    (item) => !item.checked
  ).length;
  const checkedShoppingItemsCount = shoppingItemsCount - pendingShoppingItemsCount;
  const shoppingListPlan = buildShoppingPlan({
    staples,
    inventory,
    shoppingItems,
    weekMeals: shoppingWeekMeals,
    weekKey: shoppingWeekKey,
    getMealSummary,
  });
  const shoppingListMeta = shoppingListMetaByWeek[shoppingWeekKey] || null;
  const currentGeneratedShoppingSignature = getGeneratedShoppingSignature(
    shoppingItems.filter((item) => generatedShoppingSources.includes(item.source))
  );
  const hasGeneratedShoppingRows = shoppingItems.some((item) =>
    generatedShoppingSources.includes(item.source)
  );
  const hasGeneratedShopPlan =
    hasGeneratedShoppingRows || Boolean(shoppingListMeta);
  const shoppingListIsCurrent =
    hasGeneratedShopPlan &&
    shoppingListMeta?.signature === shoppingListPlan.signature &&
    currentGeneratedShoppingSignature === shoppingListPlan.itemsSignature;
  const shoppingListNeedsUpdate =
    hasGeneratedShopPlan && !shoppingListIsCurrent;
  const shoppingActionLabel =
    !hasGeneratedShopPlan
      ? "Generate list"
      : shoppingListNeedsUpdate
        ? "Update list"
        : "Refresh list";
  const shoppingStatusLabel =
    !hasGeneratedShopPlan
      ? "Not generated"
      : shoppingListNeedsUpdate
        ? "Needs update"
        : "Current";
  const manualShoppingItemsCount = visibleShoppingItems.filter(
    (item) => item.source === "Manual" && !item.checked
  ).length;
  const recurringRemovalItems = shoppingListPlan.removeFromRecurring;
  const shoppingLastUpdatedText = shoppingListMeta?.generatedAt
    ? new Date(shoppingListMeta.generatedAt).toLocaleString("en-AU", {
      day: "numeric",
      month: "short",
      hour: "numeric",
      minute: "2-digit",
    })
    : "";

  function goToPreviousMealWeek() {
    const previousWeek = new Date(mealWeekStart);
    previousWeek.setDate(mealWeekStart.getDate() - 7);
    setMealWeekStart(previousWeek);
  }

  function goToNextMealWeek() {
    const nextWeek = new Date(mealWeekStart);
    nextWeek.setDate(mealWeekStart.getDate() + 7);
    setMealWeekStart(nextWeek);
  }

  function goToThisMealWeek() {
    setMealWeekStart(getSunday());
  }

  function goToNextMealWeekDefault() {
    setMealWeekStart(getNextSunday());
  }

  function copyPreviousWeekMeals() {
    const previousWeekStart = new Date(mealWeekStart);
    previousWeekStart.setDate(mealWeekStart.getDate() - 7);
    const previousWeekKey = getWeekKey(previousWeekStart);
    const previousMeals = mealsByWeek[previousWeekKey];

    if (!previousMeals) {
      window.alert("There's no meal plan for the previous week to copy.");
      return;
    }

    const hasExistingPlan = planningDaySummaries.some(
      (daySummary) => daySummary.hasMeal
    );

    if (
      hasExistingPlan &&
      !window.confirm(
        "Replace this week's meal plan with a copy of last week's?"
      )
    ) {
      return;
    }

    setMealsByWeek({
      ...mealsByWeek,
      [mealWeekKey]: structuredClone(previousMeals),
    });
  }

  function showHomeWeek(weekStart) {
    const nextMealWeekStart = new Date(weekStart);
    const nextShoppingWeekStart = new Date(weekStart);

    setMealWeekStart(nextMealWeekStart);
    setShoppingWeekStart(nextShoppingWeekStart);
    setExpandedMealDay(null);
  }

  function goToPreviousShoppingWeek() {
    const previousWeek = new Date(shoppingWeekStart);
    previousWeek.setDate(shoppingWeekStart.getDate() - 7);
    setShoppingWeekStart(previousWeek);
  }

  function goToNextShoppingWeek() {
    const nextWeek = new Date(shoppingWeekStart);
    nextWeek.setDate(shoppingWeekStart.getDate() + 7);
    setShoppingWeekStart(nextWeek);
  }

  function goToThisShoppingWeek() {
    setShoppingWeekStart(getSunday());
  }

  function goToNextShoppingWeekDefault() {
    setShoppingWeekStart(getNextSunday());
  }

  function updateMeal(day, updatedMeal) {
    setMealsByWeek({
      ...mealsByWeek,
      [mealWeekKey]: {
        ...meals,
        [day]: updatedMeal,
      },
    });
  }

  function openHousehold(section) {
    setHouseholdSection(section);
    setMoreSection("household");
    setActiveTab("more");
  }

  function addShoppingItem() {
    const cleanedItem = newItem.trim();
    if (cleanedItem === "") return;

    const updatedItems = [
      ...shoppingItems,
      {
        id: createCollectionId("shopping", shoppingItems, cleanedItem),
        name: cleanedItem,
        category: "Other",
        source: "Manual",
        checked: false,
      },
    ];

    setShoppingItemsByWeek({
      ...shoppingItemsByWeek,
      [shoppingWeekKey]: updatedItems,
    });

    setNewItem("");
  }

  function toggleShoppingItem(id) {
    const updatedItems = shoppingItems.map((item) =>
      item.id === id ? { ...item, checked: !item.checked } : item
    );

    setShoppingItemsByWeek({
      ...shoppingItemsByWeek,
      [shoppingWeekKey]: updatedItems,
    });
  }

  function deleteShoppingItem(id) {
    const updatedItems = shoppingItems.filter((item) => item.id !== id);

    setShoppingItemsByWeek({
      ...shoppingItemsByWeek,
      [shoppingWeekKey]: updatedItems,
    });
  }

  function addStaple() {
    const cleanedStaple = newStaple.trim();
    if (cleanedStaple === "") return;

    setStaples([
      ...staples,
      {
        id: createCollectionId("staple", staples, cleanedStaple),
        name: cleanedStaple,
        category: "Other",
        quantity: null,
        unit: "",
        frequency: "weekly",
        startDate: shoppingWeekKey,
        active: true,
      },
    ]);

    setNewStaple("");
  }

  function deleteStaple(id) {
    setStaples(staples.filter((staple) => staple.id !== id));
  }

  function updateStapleFrequency(id, frequency) {
    setStaples(
      staples.map((staple) =>
        staple.id === id ? { ...staple, frequency } : staple
      )
    );
  }

  function updateStapleCategory(id, category) {
    setStaples(
      staples.map((staple) =>
        staple.id === id ? { ...staple, category } : staple
      )
    );
  }

  function updateStapleDetails(id, updates) {
    setStaples(
      staples.map((staple) =>
        staple.id === id ? { ...staple, ...updates } : staple
      )
    );
  }

  function toggleStapleActive(id) {
    setStaples(
      staples.map((staple) =>
        staple.id === id ? { ...staple, active: !staple.active } : staple
      )
    );
  }

  function buildShoppingList() {
    setShoppingItemsByWeek({
      ...shoppingItemsByWeek,
      [shoppingWeekKey]: [
        ...shoppingListPlan.retainedShoppingItems,
        ...shoppingListPlan.newItems,
      ],
    });

    setShoppingListMetaByWeek({
      ...shoppingListMetaByWeek,
      [shoppingWeekKey]: {
        generatedAt: new Date().toISOString(),
        signature: shoppingListPlan.signature,
        summary: shoppingListPlan.summary,
      },
    });

    setActiveTab("shop");
  }

  function addInventoryItem() {
    const cleanedItem = newInventoryItem.trim();

    if (cleanedItem === "") return;

    setInventory([
      ...inventory,
      {
        id: createCollectionId("inventory", inventory, cleanedItem),
        name: cleanedItem,
        category: "Pantry",
        quantity: null,
        unit: "",
        active: true,
      },
    ]);

    setNewInventoryItem("");
  }

  function deleteInventoryItem(id) {
    setInventory(inventory.filter((item) => item.id !== id));
  }

  function updateInventoryCategory(id, category) {
    setInventory(
      inventory.map((item) =>
        item.id === id ? { ...item, category } : item
      )
    );
  }

  function toggleInventoryActive(id) {
    setInventory(
      inventory.map((item) =>
        item.id === id
          ? { ...item, active: item.active === false }
          : item
      )
    );
  }

  function loadStarterInventory() {
    const existingNames = inventory.map((item) =>
      normaliseItemName(item.name)
    );

    const starterItems = createStarterInventoryItems()
      .filter(
        (item) =>
          !existingNames.includes(normaliseItemName(item.name))
      );

    setInventory([...inventory, ...starterItems]);
  }

  function resetStockToStarterList() {
    const shouldReset = window.confirm(
      "Replace this device's stock list with the current starter stock list? This removes custom stock items on this device and marks starter stock as in stock."
    );

    if (!shouldReset) return;

    setInventory(createStarterInventoryItems());
    setNewInventoryItem("");
  }

  function addRecipe() {
    const cleanedName = newRecipeName.trim();

    if (cleanedName === "") return;

    setRecipes([
      ...recipes,
      {
        id: createCollectionId("recipe", recipes, cleanedName),
        name: cleanedName,
        category: "Family favourites",
        source: "",
        sourceUrl: "",
        ingredients: [],
        method: "",
      },
    ]);

    setNewRecipeName("");
  }

  function deleteRecipe(id) {
    const recipe = recipes.find((item) => item.id === id);
    const shouldDelete = window.confirm(
      `Delete "${recipe?.name || "this recipe"}"? Its ingredients and method will be removed. This can't be undone.`
    );

    if (!shouldDelete) return;

    setRecipes(recipes.filter((item) => item.id !== id));
  }

  function updateRecipe(recipeId, updates) {
    setRecipes(
      recipes.map((recipe) =>
        recipe.id === recipeId ? { ...recipe, ...updates } : recipe
      )
    );
  }

  function addIngredientToRecipe(recipeId, ingredientName) {
    const cleanedIngredient = ingredientName.trim();

    if (cleanedIngredient === "") return;

    setRecipes(
      recipes.map((recipe) =>
        recipe.id === recipeId
          ? {
            ...recipe,
            ingredients: [
              ...recipe.ingredients,
              cleanedIngredient,
            ],
          }
          : recipe
      )
    );
  }

  function deleteIngredientFromRecipe(recipeId, ingredientIndex) {
    setRecipes(
      recipes.map((recipe) =>
        recipe.id === recipeId
          ? {
            ...recipe,
            ingredients: recipe.ingredients.filter(
              (_, index) => index !== ingredientIndex
            ),
          }
          : recipe
      )
    );
  }


  function applyImportedData(backup) {
    if (Object.prototype.hasOwnProperty.call(backup, "mealsByWeek")) {
      setMealsByWeek(backup.mealsByWeek);
    }
    if (Object.prototype.hasOwnProperty.call(backup, "shoppingItemsByWeek")) {
      setShoppingItemsByWeek(backup.shoppingItemsByWeek);
    }
    if (Object.prototype.hasOwnProperty.call(backup, "shoppingListMetaByWeek")) {
      setShoppingListMetaByWeek(backup.shoppingListMetaByWeek);
    }
    if (Object.prototype.hasOwnProperty.call(backup, "staples")) {
      setStaples(backup.staples);
    }
    // Run imported inventory / recipes through the same migration helpers the
    // app uses when loading from localStorage, so they normalise consistently.
    if (Object.prototype.hasOwnProperty.call(backup, "inventory")) {
      setInventory(normaliseInventoryItems(backup.inventory));
    }
    if (Object.prototype.hasOwnProperty.call(backup, "recipes")) {
      setRecipes(mergeSavedRecipes(backup.recipes));
    }
  }

  return (
    <main className={`app-shell tab-${activeTab}`}>
      <header className="app-header">
        <div>
          <p className="eyebrow">Family meals</p>

          <h1>
            {activeTab === "home"
              ? "Weekly shop"
              : activeTab === "shop"
              ? "Shopping list"
              : activeTab === "more"
                ? "More"
                : "Meal plan"}
          </h1>
        </div>
      </header>

      {syncError && (
        <p className="sync-banner" role="status">
          Couldn't sync with the cloud — your latest changes may not be saved.
          Check your connection.
        </p>
      )}

      {activeTab === "home" && (
        <section className="screen home-screen">
          <div className="home-hero">
            <div className="home-week-switch" aria-label="Home week">
              <button
                type="button"
                className={homeWeekMode === "current" ? "active" : ""}
                onClick={() => showHomeWeek(currentWeekStart)}
              >
                This week
              </button>

              <button
                type="button"
                className={homeWeekMode === "next" ? "active" : ""}
                onClick={() => showHomeWeek(nextWeekStart)}
              >
                Next week
              </button>
            </div>

            <p className="section-kicker">Shopping week</p>
            <h2>
              {formatDate(shoppingWeekStart)} to {formatDate(shoppingWeekEnd)}
            </h2>
          </div>

          <div className="home-steps">
            <button
              className="home-step"
              type="button"
              onClick={() => setActiveTab("plan")}
            >
              <span className="home-step-num">1</span>

              <span className="home-step-body">
                <strong>Plan meals</strong>
                <span>
                  {mealsPlannedCount} of {days.length} dinners planned
                </span>
              </span>

              <span className="home-step-chevron">›</span>
            </button>

            <div className="home-step-action">
              <div className="home-step-head">
                <span className="home-step-num">2</span>

                <span className="home-step-body">
                  <strong>Generate shopping list</strong>
                  <span>
                    {shoppingLastUpdatedText
                      ? `Last updated ${shoppingLastUpdatedText}`
                      : "From meals, recurring buys & stock"}
                  </span>
                </span>

                <span
                  className={`list-status-pill ${
                    shoppingListNeedsUpdate ? "needs-update" : ""
                  }`}
                >
                  {shoppingStatusLabel}
                </span>
              </div>

              <button
                className="primary-button"
                type="button"
                onClick={buildShoppingList}
              >
                {shoppingActionLabel}
              </button>
            </div>

            <button
              className="home-step"
              type="button"
              onClick={() => setActiveTab("shop")}
            >
              <span className="home-step-num">3</span>

              <span className="home-step-body">
                <strong>Shop</strong>
                <span>
                  {pendingShoppingItemsCount} to buy · {checkedShoppingItemsCount}{" "}
                  done
                </span>
              </span>

              <span className="home-step-chevron">›</span>
            </button>
          </div>

          <div className="home-quicklinks">
            <p className="section-kicker">Set up</p>

            <div className="home-actions">
              <button
                className="secondary"
                onClick={() => openHousehold("stock")}
              >
                Check stock
              </button>

              <button
                className="secondary"
                onClick={() => openHousehold("recurring")}
              >
                Recurring buys
              </button>

              <button
                className="secondary"
                onClick={() => {
                  setMoreSection("recipes");
                  setActiveTab("more");
                }}
              >
                Recipes
              </button>
            </div>
          </div>
        </section>
      )}

      {activeTab === "plan" && (
        <section className="screen plan-screen">
          <div className="screen-header">
            <div>
              <p className="section-kicker">Planning week</p>
              <h2>Meals</h2>
            </div>

            <div className="date-card">
              <span>{formatDate(mealWeekStart)}</span>
              <span>to</span>
              <span>{formatDate(mealWeekEnd)}</span>
            </div>
          </div>

          <WeekControls
            activePreset={mealWeekMode}
            onThisWeek={goToThisMealWeek}
            onNextWeekPreset={goToNextMealWeekDefault}
            onPreviousWeek={goToPreviousMealWeek}
            onNextWeek={goToNextMealWeek}
          />

          <button
            className="secondary copy-week-button"
            type="button"
            onClick={copyPreviousWeekMeals}
          >
            Copy last week's plan
          </button>

          <div className="meal-grid">
            {days.map((day) => {
              const meal = meals[day];
              const daySummary = getMealSummary(day, meal, meals);

              return (
                <MealCard
                  key={day}
                  day={day}
                  meal={meal}
                  displayName={daySummary.name}
                  mealLabel={daySummary.label}
                  mealTone={daySummary.tone}
                  ingredientCount={daySummary.ingredients.length}
                  hasMeal={daySummary.hasMeal}
                  onOpen={() => setExpandedMealDay(day)}
                />
              );
            })}
          </div>

          {expandedMealDay && (
            <MealEditorSheet
              key={expandedMealDay}
              day={expandedMealDay}
              dateLabel={expandedDayLabel}
              meal={expandedMeal}
              days={days}
              recipes={recipes}
              linkedRecipe={expandedDaySummary?.linkedRecipe}
              weekDaySummaries={planningDaySummaries}
              updateMeal={updateMeal}
              onClose={() => setExpandedMealDay(null)}
              onNextDay={
                expandedNextDay
                  ? () => setExpandedMealDay(expandedNextDay)
                  : undefined
              }
            />
          )}
        </section>
      )}

      {activeTab === "shop" && (
        <ShoppingList
          newItem={newItem}
          setNewItem={setNewItem}
          addShoppingItem={addShoppingItem}
          shoppingItems={visibleShoppingItems}
          toggleShoppingItem={toggleShoppingItem}
          deleteShoppingItem={deleteShoppingItem}
          buildShoppingList={buildShoppingList}
          shoppingActionLabel={shoppingActionLabel}
          shoppingStatusLabel={shoppingStatusLabel}
          shoppingListNeedsUpdate={shoppingListNeedsUpdate}
          shoppingListSummary={shoppingListMeta?.summary || null}
          shoppingLastUpdatedText={shoppingLastUpdatedText}
          recurringRemovalItems={recurringRemovalItems}
          pendingShoppingItemsCount={pendingShoppingItemsCount}
          checkedShoppingItemsCount={checkedShoppingItemsCount}
          manualShoppingItemsCount={manualShoppingItemsCount}
          shoppingWeekStart={shoppingWeekStart}
          shoppingWeekEnd={shoppingWeekEnd}
          shoppingWeekMode={shoppingWeekMode}
          goToPreviousShoppingWeek={goToPreviousShoppingWeek}
          goToThisShoppingWeek={goToThisShoppingWeek}
          goToNextShoppingWeekDefault={goToNextShoppingWeekDefault}
          goToNextShoppingWeek={goToNextShoppingWeek}
        />
      )}

      {activeTab === "more" && (
        <section className="screen more-screen">
          <div className="screen-header">
            <div>
              <p className="section-kicker">
                {moreSection === "overview" ? "Tools" : "Manage"}
              </p>

              <h2>
                {moreSection === "overview"
                  ? "More"
                  : moreSection === "household"
                    ? "Household basics"
                    : moreSection === "recipes"
                      ? "Recipes"
                      : moreSection === "settings"
                        ? "Settings"
                        : "More"}
              </h2>
            </div>
          </div>

          {moreSection === "overview" ? (
            <div className="manager-list">
              <button
                className="manager-row"
                type="button"
                onClick={() => setMoreSection("recipes")}
              >
                <span>
                  <strong>Recipes</strong>
                  <span>
                    {recipes.length} saved recipe
                    {recipes.length === 1 ? "" : "s"}
                  </span>
                </span>
                <span className="manager-action">Manage</span>
              </button>

              <button
                className="manager-row"
                type="button"
                onClick={() => setMoreSection("household")}
              >
                <span>
                  <strong>Household basics</strong>
                  <span>
                    {activeStaplesCount} recurring, {activeInventoryCount} in stock
                  </span>
                </span>
                <span className="manager-action">Manage</span>
              </button>

              <button
                className="manager-row"
                type="button"
                onClick={() => setMoreSection("settings")}
              >
                <span>
                  <strong>Settings</strong>
                  <span>Backup &amp; restore</span>
                </span>
                <span className="manager-action">Open</span>
              </button>
            </div>
          ) : (
            <>
              <button
                className="secondary back-button"
                type="button"
                onClick={() => setMoreSection("overview")}
              >
                Back to More
              </button>

              {moreSection === "household" && (
                <HouseholdBasics
                  activeSection={householdSection}
                  setActiveSection={setHouseholdSection}
                  staples={staples}
                  activeStaplesCount={activeStaplesCount}
                  inventory={inventory}
                  activeInventoryCount={activeInventoryCount}
                  newStaple={newStaple}
                  setNewStaple={setNewStaple}
                  addStaple={addStaple}
                  deleteStaple={deleteStaple}
                  updateStapleFrequency={updateStapleFrequency}
                  updateStapleCategory={updateStapleCategory}
                  updateStapleDetails={updateStapleDetails}
                  toggleStapleActive={toggleStapleActive}
                  newInventoryItem={newInventoryItem}
                  setNewInventoryItem={setNewInventoryItem}
                  addInventoryItem={addInventoryItem}
                  deleteInventoryItem={deleteInventoryItem}
                  updateInventoryCategory={updateInventoryCategory}
                  toggleInventoryActive={toggleInventoryActive}
                  loadStarterInventory={loadStarterInventory}
                  resetStockToStarterList={resetStockToStarterList}
                />
              )}

              {moreSection === "recipes" && (
                <RecipesList
                  recipes={recipes}
                  newRecipeName={newRecipeName}
                  setNewRecipeName={setNewRecipeName}
                  addRecipe={addRecipe}
                  deleteRecipe={deleteRecipe}
                  addIngredientToRecipe={addIngredientToRecipe}
                  deleteIngredientFromRecipe={deleteIngredientFromRecipe}
                  updateRecipe={updateRecipe}
                />
              )}

              {moreSection === "settings" && (
                <SettingsPanel
                  onImport={applyImportedData}
                  user={user}
                  cloud={cloud}
                  onSignOut={signOut}
                />
              )}
            </>
          )}
        </section>
      )}

      <nav className="bottom-nav" aria-label="Primary">
        <button
          data-tab="home"
          className={activeTab === "home" ? "active" : ""}
          onClick={() => setActiveTab("home")}
        >
          Home
        </button>

        <button
          data-tab="plan"
          className={activeTab === "plan" ? "active" : ""}
          onClick={() => setActiveTab("plan")}
        >
          Plan
        </button>

        <button
          data-tab="shop"
          className={activeTab === "shop" ? "active" : ""}
          onClick={() => setActiveTab("shop")}
        >
          Shop
        </button>

        <button
          data-tab="more"
          className={activeTab === "more" ? "active" : ""}
          onClick={() => {
            setMoreSection("overview");
            setActiveTab("more");
          }}
        >
          More
        </button>
      </nav>
    </main>
  );
}

export default App;
