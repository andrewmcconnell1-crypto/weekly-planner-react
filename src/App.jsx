import { lazy, Suspense, useMemo, useState } from "react";
import {
  House,
  CalendarDays,
  ShoppingBasket,
  CookingPot,
  Settings,
} from "lucide-react";
import "./App.css";

import ShoppingList from "./components/ShoppingList";
import SignInScreen from "./components/SignInScreen";
import UpdateBanner from "./components/UpdateBanner";
import UndoSnackbar from "./components/UndoSnackbar";
import LoadingScreen from "./components/LoadingScreen";
import HomeScreen from "./components/HomeScreen";
import PlanScreen from "./components/PlanScreen";
import MoreScreen from "./components/MoreScreen";
import SettingsScreen from "./components/SettingsScreen";

// Lazily loaded: the two overlay sheets that App still renders directly, kept
// out of the initial bundle. (The editor / Kitchen / Settings screens lazy-load
// their own heavy children from within their components.)
const RecipeDiscoverySheet = lazy(
  () => import("./components/RecipeDiscoverySheet")
);
const ShoppingHelpSheet = lazy(() => import("./components/ShoppingHelpSheet"));

import { createEmptyMeals, days } from "./utils/mealUtils";
import {
  getSunday,
  getNextSunday,
  formatDate,
  getWeekKey,
} from "./utils/dateUtils";
import { createMealHelpers } from "./utils/mealPlanning";
import { buildUnifiedShoppingList } from "./utils/priorityShoppingList";
import { isSupabaseConfigured } from "./lib/supabase";
import { applyBackup } from "./lib/applyBackup";
import { useAuth } from "./hooks/useAuth";
import { usePlannerStore } from "./hooks/usePlannerStore";
import { useUpdatePrompt } from "./hooks/useUpdatePrompt";
import useBackToClose from "./hooks/useBackToClose";
import { useUndo } from "./hooks/useUndo";
import { useMealPlanActions } from "./hooks/useMealPlanActions";
import { useShoppingActions } from "./hooks/useShoppingActions";
import { useHouseholdActions } from "./hooks/useHouseholdActions";
import { useRecipeActions } from "./hooks/useRecipeActions";
import { categories } from "./data/categories";

function App() {
  const [activeTab, setActiveTab] = useState("home");
  const [moreSection, setMoreSection] = useState("overview");
  const [householdSection, setHouseholdSection] = useState("stock");
  const [expandedMealDay, setExpandedMealDay] = useState(null);
  const [discoverOpen, setDiscoverOpen] = useState(false);
  const [discoverDay, setDiscoverDay] = useState(null);
  const updateReady = useUpdatePrompt();
  // The session the welcome was dismissed for (a user id, "guest", or "local"),
  // so dismissal is per-account and auto-resets when the account changes.
  const [welcomeDismissedFor, setWelcomeDismissedFor] = useState(null);
  const [welcomePreview, setWelcomePreview] = useState(false);
  const [guest, setGuest] = useState(false);
  const [settingsReturnTab, setSettingsReturnTab] = useState("home");

  const [currentWeekStart] = useState(getSunday);
  const [nextWeekStart] = useState(getNextSunday);
  const [activeWeekStart, setActiveWeekStart] = useState(getNextSunday);
  // Meals and Shop share one active week, so these are the same value — kept as
  // named aliases so the meal/shop-specific reads below stay readable.
  const mealWeekStart = activeWeekStart;
  const shoppingWeekStart = activeWeekStart;

  const [shopLayout, setShopLayout] = useState("priority"); // "priority" | "aisle"
  const [shoppingHelpOpen, setShoppingHelpOpen] = useState(false);

  const {
    user,
    loading: authLoading,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    signInWithMagicLink,
    signOut,
  } = useAuth();
  const {
    mealsByWeek,
    setMealsByWeek,
    setShoppingItemsByWeek,
    setShoppingListMetaByWeek,
    removalAcksByWeek,
    setRemovalAcksByWeek,
    shoppingChecked,
    setShoppingChecked,
    manualShoppingItems,
    setManualShoppingItems,
    staples,
    setStaples,
    inventory,
    setInventory,
    recipes,
    setRecipes,
    settings,
    setSettings,
    loading: dataLoading,
    syncError,
    cloud,
    getRecoverySnapshots,
    captureRecoverySnapshot,
    restoreRecoverySnapshot,
  } = usePlannerStore(user, guest);

  // Let the device / browser Back button close whichever overlay sheet is open
  // instead of leaving the app. One coordinator (not one per sheet) keeps a
  // single history entry across hand-offs like editor -> discovery.
  const closeOpenOverlay = expandedMealDay
    ? () => setExpandedMealDay(null)
    : discoverOpen
      ? () => {
          setDiscoverOpen(false);
          setDiscoverDay(null);
        }
      : shoppingHelpOpen
        ? () => setShoppingHelpOpen(false)
        : null;

  useBackToClose(Boolean(closeOpenOverlay), () => closeOpenOverlay?.());

  const { undoState, requestUndo, runUndo } = useUndo();

  const mealHelpers = useMemo(() => createMealHelpers(recipes), [recipes]);
  const { getMealSummary } = mealHelpers;

  // ---- Week keys + the active week's plan (feed the action hooks below) ----
  const mealWeekKey = getWeekKey(mealWeekStart);
  const shoppingWeekKey = getWeekKey(shoppingWeekStart);
  const currentWeekKey = getWeekKey(currentWeekStart);
  const nextWeekKey = getWeekKey(nextWeekStart);
  const meals = mealsByWeek[mealWeekKey] || createEmptyMeals();

  const today = new Date();
  const todayDayName = days[today.getDay()];

  const keepStandingList = settings?.keepStandingList !== false;
  // Per-trip: are we using the saved list (online order) or shopping fresh?
  const usingSavedList =
    keepStandingList && settings?.shopUsingSavedList !== false;

  // One shopping list spanning this week + next, ordered by urgency. Ticks and
  // manual adds are persisted (shoppingChecked / manualShoppingItems).
  const {
    items: unifiedItems,
    skipped: skippedShoppingItems,
    removals: recurringRemovals,
  } = buildUnifiedShoppingList({
    staples,
    inventory,
    mealsByWeek,
    currentWeekKey,
    nextWeekKey,
    todayDayName,
    getMealSummary,
    keepStandingList,
    usingSavedList,
    manualItems: manualShoppingItems,
    checkedMap: shoppingChecked,
  });
  const removalIds = new Set(recurringRemovals.map((item) => item.id));

  // ---- Domain action hooks (each owns its slice's mutators + input state) ----
  const { setLeftoverNights, clearMealDay, assignRecipeToDay, updateMeal } =
    useMealPlanActions({
      meals,
      mealsByWeek,
      setMealsByWeek,
      mealWeekKey,
      requestUndo,
    });

  const {
    newItem,
    setNewItem,
    addShoppingItem,
    addSkippedShoppingItem,
    deleteShoppingItem,
    toggleShoppingChecked,
    toggleRemovalAck,
    setKeepStandingList,
    setUsingSavedList,
  } = useShoppingActions({
    manualShoppingItems,
    setManualShoppingItems,
    shoppingChecked,
    setShoppingChecked,
    unifiedItems,
    removalAcksByWeek,
    setRemovalAcksByWeek,
    currentWeekKey,
    removalIds,
    settings,
    setSettings,
    requestUndo,
  });

  const {
    newStaple,
    setNewStaple,
    newInventoryItem,
    setNewInventoryItem,
    addStaple,
    deleteStaple,
    updateStapleFrequency,
    updateStapleCategory,
    updateStapleDetails,
    toggleStapleActive,
    loadStarterStaples,
    resetStaplesToStarterList,
    addInventoryItem,
    deleteInventoryItem,
    updateInventoryCategory,
    toggleInventoryActive,
    loadStarterInventory,
    resetStockToStarterList,
  } = useHouseholdActions({
    staples,
    setStaples,
    inventory,
    setInventory,
    shoppingWeekKey,
    captureRecoverySnapshot,
    requestUndo,
  });

  const {
    newRecipeName,
    setNewRecipeName,
    addRecipe,
    deleteRecipe,
    updateRecipe,
    addIngredientToRecipe,
    deleteIngredientFromRecipe,
  } = useRecipeActions({ recipes, setRecipes, requestUndo });

  // ---- Auth / loading gates (after all hooks, before any data-derived work) ----
  if (isSupabaseConfigured && authLoading) {
    return <LoadingScreen message="Loading…" />;
  }

  if (isSupabaseConfigured && !user && !guest) {
    return (
      <SignInScreen
        onGoogle={signInWithGoogle}
        onEmailSignIn={signInWithEmail}
        onEmailSignUp={signUpWithEmail}
        onMagicLink={signInWithMagicLink}
        onGuest={() => setGuest(true)}
      />
    );
  }

  if (dataLoading) {
    return <LoadingScreen message="Loading your plan…" />;
  }

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

  // "Tonight" on Home: today's meal, drawn from the current week's plan.
  const currentWeekMeals = mealsByWeek[currentWeekKey] || createEmptyMeals();
  const tonightSummary = getMealSummary(
    todayDayName,
    currentWeekMeals[todayDayName],
    currentWeekMeals
  );
  const todayIndex = days.indexOf(todayDayName);
  let tonightCovers = 1;
  if (
    tonightSummary.hasMeal &&
    (currentWeekMeals[todayDayName]?.mealType || "cook") === "cook"
  ) {
    for (let i = todayIndex + 1; i < days.length; i += 1) {
      const followingMeal = currentWeekMeals[days[i]];

      if (
        followingMeal?.mealType === "repeat" &&
        followingMeal.repeatFromDay === todayDayName
      ) {
        tonightCovers += 1;
      } else {
        break;
      }
    }
  }
  const tonightLeftoverDays = days.slice(todayIndex + 1, todayIndex + tonightCovers);
  const tonightLeftoverLabel =
    tonightLeftoverDays.length === 1
      ? tonightLeftoverDays[0]
      : `${tonightLeftoverDays[0]?.slice(0, 3)}–${tonightLeftoverDays[
          tonightLeftoverDays.length - 1
        ]?.slice(0, 3)}`;
  const tonightDateLabel = today.toLocaleDateString("en-AU", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const mealWeekEnd = new Date(mealWeekStart);
  mealWeekEnd.setDate(mealWeekStart.getDate() + 6);

  const planningDaySummaries = days.map((day) =>
    getMealSummary(day, meals[day], meals)
  );
  const mealsPlannedCount = planningDaySummaries.filter(
    (daySummary) => daySummary.hasMeal
  ).length;
  const unplannedDays = planningDaySummaries
    .filter((daySummary) => !daySummary.hasMeal)
    .map((daySummary) => daySummary.day);
  const firstUnplannedDay = unplannedDays[0] || null;
  // Recipes already on the week, so the discovery deck doesn't re-offer them.
  const plannedRecipeIds = planningDaySummaries
    .map((daySummary) => daySummary.linkedRecipe?.id)
    .filter(Boolean);
  const planGapsLabel =
    unplannedDays.length === 0
      ? "Every night is planned."
      : unplannedDays.length <= 2
        ? `${unplannedDays.join(" and ")} still need${
            unplannedDays.length === 1 ? "s" : ""
          } a meal.`
        : `${unplannedDays.length} nights still need a meal.`;

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

  // "How many nights?" for the open day: 1 (cook night) + the consecutive run
  // of following days that repeat this day's meal as leftovers.
  let expandedLeftoverNights = 1;
  if (expandedDayIndex >= 0) {
    for (let index = expandedDayIndex + 1; index < days.length; index += 1) {
      const followingMeal = meals[days[index]];

      if (
        followingMeal?.mealType === "repeat" &&
        followingMeal.repeatFromDay === expandedMealDay
      ) {
        expandedLeftoverNights += 1;
      } else {
        break;
      }
    }
  }
  // A cooked meal can stretch to at most 3 nights of leftovers, never past the
  // end of the week.
  const expandedMaxNights =
    expandedDayIndex >= 0 ? Math.min(3, days.length - expandedDayIndex) : 1;

  const activeStaplesCount = staples.filter(
    (staple) => staple.active !== false
  ).length;

  const activeInventoryCount = inventory.filter(
    (item) => item.active !== false
  ).length;

  // Categories offered when adding/editing stock & recurring buys: the built-in
  // aisles plus any custom ones already on items (so user-created categories
  // stick around and are shared across both lists). "Other" stays last.
  const customCategories = [
    ...new Set(
      [...staples, ...inventory]
        .map((item) => item.category)
        .filter((category) => category && !categories.includes(category))
    ),
  ].sort((a, b) => a.localeCompare(b));
  const availableCategories = [
    ...categories.filter((category) => category !== "Other"),
    ...customCategories,
    "Other",
  ];

  const unifiedPending = unifiedItems.filter((item) => !item.checked).length;
  // Removals are about this week's standing order; their "handled" ticks are
  // kept per week, pruned to removals still present.
  const removalAckIds = (removalAcksByWeek[currentWeekKey] || []).filter((id) =>
    removalIds.has(id)
  );
  const pendingRemovalCount = recurringRemovals.filter(
    (item) => !removalAckIds.includes(item.id)
  ).length;

  // Whether the user has completed the full workflow (plan a meal -> tick
  // something off the list). Derived, so we never setState inside an effect.
  const welcomeWorkflowComplete =
    Object.values(mealsByWeek).some((weekMeals) =>
      days.some((d) => {
        const m = weekMeals?.[d];
        return (
          m && (m.name || m.recipeId || (m.mealType && m.mealType !== "cook"))
        );
      })
    ) && Object.values(shoppingChecked).some(Boolean);

  // Identifies the current session so the welcome's dismissed/done state is
  // per-account: a new sign-in, sign-out, or guest gets a different key and
  // therefore sees the card again (until their data shows a completed workflow).
  const welcomeSessionKey = guest ? "guest" : user?.id || "local";
  const showWelcome =
    welcomeDismissedFor !== welcomeSessionKey &&
    (welcomePreview || !welcomeWorkflowComplete);

  function goToPreviousMealWeek() {
    const previousWeek = new Date(mealWeekStart);
    previousWeek.setDate(mealWeekStart.getDate() - 7);
    setActiveWeekStart(previousWeek);
  }

  function goToNextMealWeek() {
    const nextWeek = new Date(mealWeekStart);
    nextWeek.setDate(mealWeekStart.getDate() + 7);
    setActiveWeekStart(nextWeek);
  }

  function goToThisMealWeek() {
    setActiveWeekStart(getSunday());
  }

  function goToNextMealWeekDefault() {
    setActiveWeekStart(getNextSunday());
  }

  function showHomeWeek(weekStart) {
    setActiveWeekStart(new Date(weekStart));
    setExpandedMealDay(null);
  }

  function openTonightInPlan() {
    setActiveWeekStart(new Date(currentWeekStart));
    setExpandedMealDay(todayDayName);
    setActiveTab("plan");
  }

  function openHomeDayInPlan(day) {
    setActiveWeekStart(new Date(currentWeekStart));
    setExpandedMealDay(day);
    setActiveTab("plan");
  }

  function dismissWelcome() {
    setWelcomePreview(false);
    setWelcomeDismissedFor(welcomeSessionKey);
  }

  function openHousehold(section) {
    setHouseholdSection(section);
    setMoreSection("household");
    setActiveTab("more");
  }

  function openSettings() {
    setSettingsReturnTab(activeTab === "settings" ? "home" : activeTab);
    setActiveTab("settings");
  }

  function closeSettings() {
    setActiveTab(settingsReturnTab);
  }

  function openShoppingList() {
    setActiveTab("shop");
  }

  // Restore a backup non-destructively (see lib/applyBackup). Wired with the
  // current slices + setters so the pure helper can do the work.
  function applyImportedData(backup) {
    return applyBackup(backup, {
      mealsByWeek,
      shoppingChecked,
      manualShoppingItems,
      settings,
      staples,
      inventory,
      recipes,
      setMealsByWeek,
      setShoppingItemsByWeek,
      setShoppingListMetaByWeek,
      setShoppingChecked,
      setManualShoppingItems,
      setSettings,
      setStaples,
      setInventory,
      setRecipes,
      captureRecoverySnapshot,
    });
  }

  // Home shopping status, from the live unified list (this week + next).
  let homeShopStatus;
  if (unifiedItems.length === 0) {
    homeShopStatus = {
      tone: "done",
      title: "Nothing to buy",
      sub: "Plan some meals or mark stock as out",
      actionLabel: null,
      onAction: null,
    };
  } else if (unifiedPending > 0) {
    homeShopStatus = {
      tone: "needs",
      title: "Shopping list ready",
      sub: `${unifiedPending} item${unifiedPending === 1 ? "" : "s"} to buy`,
      actionLabel: "Open list",
      onAction: openShoppingList,
    };
  } else {
    homeShopStatus = {
      tone: "done",
      title: "Shopping sorted",
      sub: "Everything's ticked off",
      actionLabel: null,
      onAction: null,
    };
  }

  const comingUpDays = todayIndex >= 0 ? days.slice(todayIndex + 1) : [];

  return (
    <main className={`app-shell tab-${activeTab}`}>
      <header className="app-header">
        <div>
          <p className="eyebrow">Family meals</p>

          <h1>
            {activeTab === "home"
              ? "Home"
              : activeTab === "shop"
              ? "Shopping list"
              : activeTab === "more"
                ? "Kitchen"
                : activeTab === "settings"
                  ? "Settings"
                  : "Meals"}
          </h1>
        </div>

        {activeTab !== "settings" && (
          <button
            type="button"
            className="header-settings"
            aria-label="Settings"
            onClick={openSettings}
          >
            <Settings size={20} strokeWidth={2} aria-hidden="true" />
          </button>
        )}
      </header>

      {syncError && (
        <p className="sync-banner" role="status">
          Couldn't sync with the cloud — your latest changes may not be saved.
          Check your connection.
        </p>
      )}

      {isSupabaseConfigured && !user && guest && (
        <div className="guest-banner" role="status">
          <span>
            Exploring with sample data — nothing here is saved. Sign in to start
            your own plan from scratch and sync across devices.
          </span>

          <button
            type="button"
            onClick={() => {
              setActiveTab("home");
              setGuest(false);
            }}
          >
            Sign in
          </button>
        </div>
      )}

      {activeTab === "home" && (
        <HomeScreen
          todayDayName={todayDayName}
          tonightDateLabel={tonightDateLabel}
          tonightSummary={tonightSummary}
          tonightCovers={tonightCovers}
          tonightLeftoverLabel={tonightLeftoverLabel}
          openTonightInPlan={openTonightInPlan}
          homeWeekMode={homeWeekMode}
          showHomeWeek={showHomeWeek}
          currentWeekStart={currentWeekStart}
          nextWeekStart={nextWeekStart}
          mealWeekStart={mealWeekStart}
          mealWeekEnd={mealWeekEnd}
          showWelcome={showWelcome}
          dismissWelcome={dismissWelcome}
          setActiveTab={setActiveTab}
          comingUpDays={comingUpDays}
          meals={meals}
          getMealSummary={getMealSummary}
          openHomeDayInPlan={openHomeDayInPlan}
          homeShopStatus={homeShopStatus}
          mealsPlannedCount={mealsPlannedCount}
          openHousehold={openHousehold}
          activeInventoryCount={activeInventoryCount}
          activeStaplesCount={activeStaplesCount}
          unifiedPending={unifiedPending}
          unifiedItems={unifiedItems}
          setMoreSection={setMoreSection}
        />
      )}

      {activeTab === "plan" && (
        <PlanScreen
          mealWeekStart={mealWeekStart}
          mealWeekEnd={mealWeekEnd}
          mealsPlannedCount={mealsPlannedCount}
          planGapsLabel={planGapsLabel}
          firstUnplannedDay={firstUnplannedDay}
          setExpandedMealDay={setExpandedMealDay}
          setDiscoverDay={setDiscoverDay}
          setDiscoverOpen={setDiscoverOpen}
          mealWeekMode={mealWeekMode}
          goToThisMealWeek={goToThisMealWeek}
          goToNextMealWeekDefault={goToNextMealWeekDefault}
          goToPreviousMealWeek={goToPreviousMealWeek}
          goToNextMealWeek={goToNextMealWeek}
          meals={meals}
          getMealSummary={getMealSummary}
          recipes={recipes}
          expandedMealDay={expandedMealDay}
          expandedDayLabel={expandedDayLabel}
          expandedMeal={expandedMeal}
          expandedDaySummary={expandedDaySummary}
          planningDaySummaries={planningDaySummaries}
          expandedLeftoverNights={expandedLeftoverNights}
          expandedMaxNights={expandedMaxNights}
          expandedNextDay={expandedNextDay}
          setLeftoverNights={setLeftoverNights}
          clearMealDay={clearMealDay}
          updateMeal={updateMeal}
        />
      )}

      {activeTab === "shop" && (
        <ShoppingList
          newItem={newItem}
          setNewItem={setNewItem}
          addShoppingItem={addShoppingItem}
          availableCategories={availableCategories}
          unifiedItems={unifiedItems}
          unifiedPending={unifiedPending}
          onToggleChecked={toggleShoppingChecked}
          onDeleteManual={deleteShoppingItem}
          skippedItems={skippedShoppingItems}
          onAddSkipped={addSkippedShoppingItem}
          keepStandingList={keepStandingList}
          usingSavedList={usingSavedList}
          setUsingSavedList={setUsingSavedList}
          removals={recurringRemovals}
          removalAckIds={removalAckIds}
          pendingRemovalCount={pendingRemovalCount}
          onToggleRemoval={toggleRemovalAck}
          shopLayout={shopLayout}
          setShopLayout={setShopLayout}
          onOpenHelp={() => setShoppingHelpOpen(true)}
        />
      )}

      {activeTab === "more" && (
        <MoreScreen
          moreSection={moreSection}
          setMoreSection={setMoreSection}
          householdSection={householdSection}
          openHousehold={openHousehold}
          availableCategories={availableCategories}
          recipes={recipes}
          activeStaplesCount={activeStaplesCount}
          activeInventoryCount={activeInventoryCount}
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
          newRecipeName={newRecipeName}
          setNewRecipeName={setNewRecipeName}
          addRecipe={addRecipe}
          deleteRecipe={deleteRecipe}
          addIngredientToRecipe={addIngredientToRecipe}
          deleteIngredientFromRecipe={deleteIngredientFromRecipe}
          updateRecipe={updateRecipe}
        />
      )}

      {activeTab === "settings" && (
        <SettingsScreen
          closeSettings={closeSettings}
          onImport={applyImportedData}
          user={user}
          cloud={cloud}
          onSignOut={() => {
            // Sign out happens from the Settings screen; reset the tab so the
            // next sign-in lands on Home, not back on Settings.
            setActiveTab("home");
            signOut();
          }}
          keepStandingList={keepStandingList}
          onSetKeepStandingList={setKeepStandingList}
          onOpenShoppingHelp={() => setShoppingHelpOpen(true)}
          resetStockToStarterList={resetStockToStarterList}
          resetStaplesToStarterList={resetStaplesToStarterList}
          getRecoverySnapshots={getRecoverySnapshots}
          onRestoreSnapshot={restoreRecoverySnapshot}
          onResetWelcome={() => {
            setWelcomePreview(true);
            setWelcomeDismissedFor(null);
            setActiveTab("home");
          }}
        />
      )}

      {updateReady && (
        <UpdateBanner onReload={() => window.location.reload()} />
      )}

      {undoState && (
        <UndoSnackbar message={undoState.message} onUndo={runUndo} />
      )}

      {discoverOpen && (
        <Suspense fallback={null}>
          <RecipeDiscoverySheet
            recipes={recipes}
            unplannedDays={unplannedDays}
            initialDay={discoverDay}
            plannedRecipeIds={plannedRecipeIds}
            onAssign={assignRecipeToDay}
            onClose={() => {
              setDiscoverOpen(false);
              setDiscoverDay(null);
            }}
          />
        </Suspense>
      )}

      {shoppingHelpOpen && (
        <Suspense fallback={null}>
          <ShoppingHelpSheet
            keepStandingList={keepStandingList}
            onClose={() => setShoppingHelpOpen(false)}
          />
        </Suspense>
      )}

      <nav className="bottom-nav" aria-label="Primary">
        <button
          data-tab="home"
          className={activeTab === "home" ? "active" : ""}
          onClick={() => setActiveTab("home")}
        >
          <House size={21} strokeWidth={2} aria-hidden="true" />
          <span>Home</span>
        </button>

        <button
          data-tab="plan"
          className={activeTab === "plan" ? "active" : ""}
          onClick={() => setActiveTab("plan")}
        >
          <CalendarDays size={21} strokeWidth={2} aria-hidden="true" />
          <span>Meals</span>
        </button>

        <button
          data-tab="shop"
          className={activeTab === "shop" ? "active" : ""}
          onClick={() => setActiveTab("shop")}
        >
          <ShoppingBasket size={21} strokeWidth={2} aria-hidden="true" />
          <span>Shop</span>
        </button>

        <button
          data-tab="more"
          className={activeTab === "more" ? "active" : ""}
          onClick={() => {
            setMoreSection("overview");
            setActiveTab("more");
          }}
        >
          <CookingPot size={21} strokeWidth={2} aria-hidden="true" />
          <span>Kitchen</span>
        </button>
      </nav>
    </main>
  );
}

export default App;
