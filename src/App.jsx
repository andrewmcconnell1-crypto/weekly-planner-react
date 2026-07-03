import { lazy, Suspense, useMemo, useState } from "react";
import {
  House,
  CalendarDays,
  ShoppingBasket,
  CookingPot,
} from "lucide-react";
import "./App.css";

import ShoppingList from "./components/ShoppingList";
import SignInScreen from "./components/SignInScreen";
import UpdatePasswordScreen from "./components/UpdatePasswordScreen";
import ProfileButton from "./components/ProfileButton";
import UpdateBanner from "./components/UpdateBanner";
import InviteBanner from "./components/InviteBanner";
import InstallBanner from "./components/InstallBanner";
import UndoSnackbar from "./components/UndoSnackbar";
import LoadingScreen from "./components/LoadingScreen";
import ErrorBoundary from "./components/ErrorBoundary";
import SheetError from "./components/SheetError";
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
const StockCatalogSheet = lazy(() => import("./components/StockCatalogSheet"));
const WalkthroughSheet = lazy(() => import("./components/WalkthroughSheet"));

import { createEmptyMeals, days } from "./utils/mealUtils";
import { getSunday, getNextSunday, getWeekKey } from "./utils/dateUtils";
import { greeting } from "./utils/greeting";
import { createMealHelpers } from "./utils/mealPlanning";
import { buildUnifiedShoppingList } from "./utils/priorityShoppingList";
import { buildPlannerView } from "./utils/plannerView";
import { listKnownGroups } from "./utils/ingredientMatch";
import { isSupabaseConfigured } from "./lib/supabase";
import { applyBackup } from "./lib/applyBackup";
import { captureJoinCodeFromUrl } from "./lib/household";

import { useAuth } from "./hooks/useAuth";
import { useTheme } from "./hooks/useTheme";
import { useHousehold } from "./hooks/useHousehold";
import { usePlannerStore } from "./hooks/usePlannerStore";
import { useUpdatePrompt } from "./hooks/useUpdatePrompt";
import { useInstallPrompt } from "./hooks/useInstallPrompt";
import useBackToClose from "./hooks/useBackToClose";
import { useUndo } from "./hooks/useUndo";
import { useMealPlanActions } from "./hooks/useMealPlanActions";
import { useShoppingActions } from "./hooks/useShoppingActions";
import { useHouseholdActions } from "./hooks/useHouseholdActions";
import { useRecipeActions } from "./hooks/useRecipeActions";

function App() {
  const [activeTab, setActiveTab] = useState("home");
  const [moreSection, setMoreSection] = useState("overview");
  const [householdSection, setHouseholdSection] = useState("stock");
  const [expandedMealDay, setExpandedMealDay] = useState(null);
  const [discoverOpen, setDiscoverOpen] = useState(false);
  const [discoverDay, setDiscoverDay] = useState(null);
  const updateReady = useUpdatePrompt();
  const install = useInstallPrompt();
  // Remember a dismissed install prompt so it doesn't nag on every visit.
  const [installDismissed, setInstallDismissed] = useState(() => {
    try {
      return localStorage.getItem("installBannerDismissed") === "1";
    } catch {
      return false;
    }
  });
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
  const [stockCatalogOpen, setStockCatalogOpen] = useState(false);
  const [walkthroughOpen, setWalkthroughOpen] = useState(false);
  // A ?join=CODE from an invite link, captured (and stripped from the URL) once
  // on load. Drives the invite banner and prefills the Household join field.
  const [pendingJoinCode, setPendingJoinCode] = useState(captureJoinCodeFromUrl);
  const [inviteDismissed, setInviteDismissed] = useState(false);

  const {
    user,
    loading: authLoading,
    recoveryMode,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    signInWithMagicLink,
    resetPassword,
    updatePassword,
    updateDisplayName,
    resendConfirmation,
    cancelRecovery,
    signOut,
  } = useAuth();
  const { theme, setTheme } = useTheme();
  // Which planner row to read/write: a shared household owner's id, or the
  // user's own id when solo. Resolved before the data load so members land on
  // the shared plan.
  const household = useHousehold(user);
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
    ingredientGroups,
    setIngredientGroups,
    loading: dataLoading,
    syncError,
    cloud,
    remoteUpdatePending,
    applyRemoteUpdate,
    dismissRemoteUpdate,
    getRecoverySnapshots,
    captureRecoverySnapshot,
    restoreRecoverySnapshot,
  } = usePlannerStore(user, guest, household.ownerId);

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
        : stockCatalogOpen
          ? () => setStockCatalogOpen(false)
          : walkthroughOpen
            ? () => setWalkthroughOpen(false)
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
    ingredientGroups,
  });
  const removalIds = new Set(recurringRemovals.map((item) => item.id));

  // ---- Domain action hooks (each owns its slice's mutators + input state) ----
  const {
    setLeftoverNights,
    clearMealDay,
    assignRecipeToDay,
    updateMeal,
    swapMealDays,
  } = useMealPlanActions({
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
    setInventory,
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
    activateStockItem,
    deleteInventoryItem,
    updateInventoryCategory,
    toggleInventoryActive,
    loadStarterInventory,
    resetStockToStarterList,
    updateIngredientGroup,
  } = useHouseholdActions({
    staples,
    setStaples,
    inventory,
    setInventory,
    shoppingWeekKey,
    setIngredientGroups,
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
  } = useRecipeActions({
    recipes,
    setRecipes,
    requestUndo,
    defaultServings: settings?.defaultServings ?? 4,
  });

  // ---- Auth / loading gates (after all hooks, before any data-derived work) ----
  if (isSupabaseConfigured && authLoading) {
    return <LoadingScreen message="Loading…" />;
  }

  // A password-recovery link takes precedence: the link signs the user in, but
  // we collect a new password before showing their plan.
  if (isSupabaseConfigured && recoveryMode) {
    return (
      <UpdatePasswordScreen
        onUpdatePassword={updatePassword}
        onCancel={cancelRecovery}
      />
    );
  }

  if (isSupabaseConfigured && !user && !guest) {
    return (
      <SignInScreen
        onGoogle={signInWithGoogle}
        onEmailSignIn={signInWithEmail}
        onEmailSignUp={signUpWithEmail}
        onMagicLink={signInWithMagicLink}
        onResetPassword={resetPassword}
        onResendConfirmation={resendConfirmation}
        onGuest={() => setGuest(true)}
      />
    );
  }

  if (dataLoading) {
    return <LoadingScreen message="Loading your plan…" />;
  }

  // Everything the screens render from is derived here, in one pure pass.
  const {
    mealWeekMode,
    tonightSummary,
    tonightCovers,
    tonightLeftoverLabel,
    tonightDateLabel,
    mealWeekEnd,
    planningDaySummaries,
    mealsPlannedCount,
    unplannedDays,
    firstUnplannedDay,
    plannedRecipeIds,
    planGapsLabel,
    expandedMeal,
    expandedDaySummary,
    expandedDayLabel,
    expandedLeftoverNights,
    expandedMaxNights,
    activeStaplesCount,
    activeInventoryCount,
    availableCategories,
    unifiedPending,
    removalAckIds,
    pendingRemovalCount,
    welcomeSessionKey,
    showWelcome,
    currentWeekMeals,
    nextWeekPlannedCount,
  } = buildPlannerView({
    mealWeekStart,
    mealWeekKey,
    currentWeekKey,
    nextWeekKey,
    shoppingWeekKey,
    mealsByWeek,
    meals,
    getMealSummary,
    today,
    todayDayName,
    expandedMealDay,
    staples,
    inventory,
    unifiedItems,
    recurringRemovals,
    removalIds,
    removalAcksByWeek,
    shoppingChecked,
    guest,
    user,
    welcomeDismissedFor,
    welcomePreview,
  });

  // Group-name suggestions for the stock / recurring editors' datalist.
  const availableGroups = listKnownGroups(ingredientGroups);

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

  function openNextWeekPlan() {
    setActiveWeekStart(new Date(nextWeekStart));
    setExpandedMealDay(null);
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

  return (
    <main className={`app-shell tab-${activeTab}`}>
      <header className="app-header">
        <div>
          <p className="eyebrow">Family meals</p>

          <h1>
            {activeTab === "home"
              ? greeting(new Date(), user?.user_metadata?.full_name || "")
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
          <ProfileButton user={user} guest={guest} onClick={openSettings} />
        )}
      </header>

      {syncError && (
        <p className="sync-banner" role="status">
          Couldn't sync with the cloud — your latest changes may not be saved.
          Check your connection.
        </p>
      )}

      {remoteUpdatePending && (
        <div className="conflict-banner" role="status">
          <span>
            Your plan was updated on another device while you were editing.
          </span>

          <div className="conflict-actions">
            <button
              type="button"
              className="primary-button"
              onClick={applyRemoteUpdate}
            >
              Use the update
            </button>

            <button
              type="button"
              className="secondary"
              onClick={dismissRemoteUpdate}
            >
              Keep editing
            </button>
          </div>
        </div>
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

      <div className="screen-swap" key={activeTab}>
      {activeTab === "home" && (
        <HomeScreen
          todayDayName={todayDayName}
          tonightDateLabel={tonightDateLabel}
          tonightSummary={tonightSummary}
          tonightCovers={tonightCovers}
          tonightLeftoverLabel={tonightLeftoverLabel}
          openTonightInPlan={openTonightInPlan}
          currentWeekStart={currentWeekStart}
          showWelcome={showWelcome}
          dismissWelcome={dismissWelcome}
          setActiveTab={setActiveTab}
          meals={currentWeekMeals}
          getMealSummary={getMealSummary}
          openHomeDayInPlan={openHomeDayInPlan}
          homeShopStatus={homeShopStatus}
          nextWeekPlannedCount={nextWeekPlannedCount}
          openNextWeekPlan={openNextWeekPlan}
          setMoreSection={setMoreSection}
          openWalkthrough={() => setWalkthroughOpen(true)}
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
          setLeftoverNights={setLeftoverNights}
          clearMealDay={clearMealDay}
          updateMeal={updateMeal}
          swapMealDays={swapMealDays}
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
          onOpenStockCatalog={() => setStockCatalogOpen(true)}
          ingredientGroups={ingredientGroups}
          availableGroups={availableGroups}
          updateIngredientGroup={updateIngredientGroup}
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
          guest={guest}
          household={household}
          pendingJoinCode={pendingJoinCode}
          onJoinedHousehold={() => {
            setPendingJoinCode(null);
            setInviteDismissed(false);
          }}
          onUpdateName={updateDisplayName}
          onUpdatePassword={updatePassword}
          onSignOut={() => {
            // Sign out happens from the Settings screen; reset the tab so the
            // next sign-in lands on Home, not back on Settings.
            setActiveTab("home");
            signOut();
          }}
          keepStandingList={keepStandingList}
          onSetKeepStandingList={setKeepStandingList}
          defaultServings={settings?.defaultServings ?? 4}
          onSetDefaultServings={(value) =>
            setSettings({
              ...settings,
              defaultServings: Math.min(99, Math.max(1, value)),
            })
          }
          theme={theme}
          onSetTheme={setTheme}
          install={install}
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
          onReplayTour={() => setWalkthroughOpen(true)}
        />
      )}
      </div>

      {updateReady && (
        <UpdateBanner onReload={() => window.location.reload()} />
      )}

      {pendingJoinCode &&
        cloud &&
        !inviteDismissed &&
        household.available &&
        !household.isShared &&
        activeTab !== "settings" && (
          <InviteBanner
            onReview={() => setActiveTab("settings")}
            onDismiss={() => setInviteDismissed(true)}
          />
        )}

      {!install.isStandalone &&
        !installDismissed &&
        !updateReady &&
        activeTab !== "settings" &&
        (install.canPromptInstall || install.isIOSSafari) && (
          <InstallBanner
            mode={install.canPromptInstall ? "prompt" : "ios"}
            onInstall={install.promptInstall}
            onDismiss={() => {
              setInstallDismissed(true);
              try {
                localStorage.setItem("installBannerDismissed", "1");
              } catch {
                // ignore storage failures (private mode); banner just returns next load
              }
            }}
          />
        )}

      {undoState && (
        <UndoSnackbar message={undoState.message} onUndo={runUndo} />
      )}

      {discoverOpen && (
        <ErrorBoundary
          fallback={
            <SheetError
              onClose={() => {
                setDiscoverOpen(false);
                setDiscoverDay(null);
              }}
            />
          }
        >
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
        </ErrorBoundary>
      )}

      {shoppingHelpOpen && (
        <ErrorBoundary
          fallback={<SheetError onClose={() => setShoppingHelpOpen(false)} />}
        >
          <Suspense fallback={null}>
            <ShoppingHelpSheet
              keepStandingList={keepStandingList}
              onClose={() => setShoppingHelpOpen(false)}
            />
          </Suspense>
        </ErrorBoundary>
      )}

      {stockCatalogOpen && (
        <ErrorBoundary
          fallback={<SheetError onClose={() => setStockCatalogOpen(false)} />}
        >
          <Suspense fallback={null}>
            <StockCatalogSheet
              inventory={inventory}
              onActivate={activateStockItem}
              onClose={() => setStockCatalogOpen(false)}
            />
          </Suspense>
        </ErrorBoundary>
      )}

      {walkthroughOpen && (
        <ErrorBoundary
          fallback={<SheetError onClose={() => setWalkthroughOpen(false)} />}
        >
          <Suspense fallback={null}>
            <WalkthroughSheet
              onClose={() => setWalkthroughOpen(false)}
              onStartPlanning={() => {
                setWalkthroughOpen(false);
                setActiveTab("plan");
              }}
            />
          </Suspense>
        </ErrorBoundary>
      )}

      <nav className="bottom-nav" aria-label="Primary">
        <button
          data-tab="home"
          className={activeTab === "home" ? "active" : ""}
          aria-current={activeTab === "home" ? "page" : undefined}
          onClick={() => setActiveTab("home")}
        >
          <House size={21} strokeWidth={2} aria-hidden="true" />
          <span>Home</span>
        </button>

        <button
          data-tab="plan"
          className={activeTab === "plan" ? "active" : ""}
          aria-current={activeTab === "plan" ? "page" : undefined}
          onClick={() => setActiveTab("plan")}
        >
          <CalendarDays size={21} strokeWidth={2} aria-hidden="true" />
          <span>Meals</span>
        </button>

        <button
          data-tab="shop"
          className={activeTab === "shop" ? "active" : ""}
          aria-current={activeTab === "shop" ? "page" : undefined}
          onClick={() => setActiveTab("shop")}
        >
          <ShoppingBasket size={21} strokeWidth={2} aria-hidden="true" />
          <span>Shop</span>
        </button>

        <button
          data-tab="more"
          className={activeTab === "more" ? "active" : ""}
          aria-current={activeTab === "more" ? "page" : undefined}
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
