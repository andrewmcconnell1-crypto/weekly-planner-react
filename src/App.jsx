import { useMemo, useState } from "react";
import {
  House,
  CalendarDays,
  ShoppingBasket,
  CookingPot,
  Settings,
  BookOpen,
  Repeat2,
  Package,
  ChevronLeft,
} from "lucide-react";
import "./App.css";

import HouseholdBasics from "./components/HouseholdBasics";
import MealCard from "./components/MealCard";
import MealEditorSheet from "./components/MealEditorSheet";
import MealLeftoverCluster from "./components/MealLeftoverCluster";
import TonightCard from "./components/TonightCard";
import ShoppingList from "./components/ShoppingList";
import ShoppingHelpSheet from "./components/ShoppingHelpSheet";
import WeekControls from "./components/WeekControls";
import RecipesList from "./components/RecipesList";
import SettingsPanel from "./components/SettingsPanel";
import SignInScreen from "./components/SignInScreen";

import { createEmptyMeal, createEmptyMeals, days } from "./utils/mealUtils";
import {
  getSunday,
  getNextSunday,
  formatDate,
  getWeekKey,
} from "./utils/dateUtils";
import { normaliseItemName, createCollectionId } from "./utils/itemUtils";
import { createMealHelpers } from "./utils/mealPlanning";
import { buildUnifiedShoppingList } from "./utils/priorityShoppingList";
import {
  createStarterInventoryItems,
  normaliseInventoryItems,
  mergeSavedRecipes,
} from "./utils/dataLoaders";
import { initialStaples } from "./data/initialStaples";
import { isSupabaseConfigured } from "./lib/supabase";
import { useAuth } from "./hooks/useAuth";
import { usePlannerStore } from "./hooks/usePlannerStore";
import { categories } from "./data/categories";

function LoadingScreen({ message }) {
  return (
    <main className="app-shell tab-home auth-shell">
      <section className="auth-card">
        <p className="small-text">{message}</p>
      </section>
    </main>
  );
}

// Group an ordered list of days into render groups: each cook day plus the run
// of leftover (repeat) days that immediately follow it. Used by both the Meals
// tab and the Home "coming up" list so they render identically.
function buildMealGroups(dayList, mealsObj, getSummary) {
  const groups = [];

  for (let i = 0; i < dayList.length; ) {
    const day = dayList[i];
    const leadSummary = getSummary(day, mealsObj[day], mealsObj);
    const repeatDays = [];

    if (leadSummary.hasMeal && (mealsObj[day]?.mealType || "cook") === "cook") {
      for (let j = i + 1; j < dayList.length; j += 1) {
        const nextMeal = mealsObj[dayList[j]];

        if (nextMeal?.mealType === "repeat" && nextMeal.repeatFromDay === day) {
          repeatDays.push(dayList[j]);
        } else {
          break;
        }
      }
    }

    groups.push({ leadDay: day, leadSummary, repeatDays });
    i += 1 + repeatDays.length;
  }

  return groups;
}

function App() {
  const [activeTab, setActiveTab] = useState("home");
  const [moreSection, setMoreSection] = useState("overview");
  const [householdSection, setHouseholdSection] = useState("stock");
  const [expandedMealDay, setExpandedMealDay] = useState(null);
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
  } = usePlannerStore(user, guest);

  const [newItem, setNewItem] = useState("");
  const [newStaple, setNewStaple] = useState("");
  const [newInventoryItem, setNewInventoryItem] = useState("");
  const [newRecipeName, setNewRecipeName] = useState("");
  const [shopLayout, setShopLayout] = useState("priority"); // "priority" | "aisle"
  const [shoppingHelpOpen, setShoppingHelpOpen] = useState(false);

  const keepStandingList = settings?.keepStandingList !== false;
  // Per-trip: are we using the saved list (online order) or shopping fresh?
  const usingSavedList =
    keepStandingList && settings?.shopUsingSavedList !== false;

  const mealHelpers = useMemo(() => createMealHelpers(recipes), [recipes]);
  const { getMealSummary } = mealHelpers;

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
  const meals = mealsByWeek[mealWeekKey] || createEmptyMeals();

  // "Tonight" on Home: today's meal, drawn from the current week's plan.
  const today = new Date();
  const todayDayName = days[today.getDay()];
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

  const shoppingWeekEnd = new Date(shoppingWeekStart);
  shoppingWeekEnd.setDate(shoppingWeekStart.getDate() + 6);

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
  const expandedMaxNights =
    expandedDayIndex >= 0 ? Math.min(7, days.length - expandedDayIndex) : 1;

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
  const unifiedPending = unifiedItems.filter((item) => !item.checked).length;
  // Removals are about this week's standing order; their "handled" ticks are
  // kept per week, pruned to removals still present.
  const removalIds = new Set(recurringRemovals.map((item) => item.id));
  const removalAckIds = (removalAcksByWeek[currentWeekKey] || []).filter((id) =>
    removalIds.has(id)
  );
  const pendingRemovalCount = recurringRemovals.filter(
    (item) => !removalAckIds.includes(item.id)
  ).length;

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

  // Render a list of days as MealCards / leftover clusters (shared by the Meals
  // tab and the Home "coming up" list so the styling matches).
  function renderMealGroups(dayList, onOpenDay) {
    return buildMealGroups(dayList, meals, getMealSummary).map((group) =>
      group.repeatDays.length === 0 ? (
        <MealCard
          key={group.leadDay}
          day={group.leadDay}
          meal={meals[group.leadDay]}
          displayName={group.leadSummary.name}
          mealLabel={group.leadSummary.label}
          mealTone={group.leadSummary.tone}
          hasMeal={group.leadSummary.hasMeal}
          onOpen={() => onOpenDay(group.leadDay)}
        />
      ) : (
        <MealLeftoverCluster
          key={group.leadDay}
          leadDay={group.leadDay}
          leadSummary={group.leadSummary}
          repeatDays={group.repeatDays}
          onOpenDay={onOpenDay}
        />
      )
    );
  }

  function dismissWelcome() {
    setWelcomePreview(false);
    setWelcomeDismissedFor(welcomeSessionKey);
  }

  // Cook once, eat for `nights` nights: keep the meal on startDay and mark the
  // next nights-1 consecutive days as repeats of it. Shrinking clears the
  // trailing repeat days that pointed back at startDay; never spills past
  // Saturday.
  function setLeftoverNights(startDay, nights) {
    const startIndex = days.indexOf(startDay);

    if (startIndex === -1) return;

    const updatedMeals = { ...meals };

    for (let index = startIndex + 1; index < days.length; index += 1) {
      const day = days[index];
      const existingMeal = updatedMeals[day];
      const repeatsStartDay =
        existingMeal?.mealType === "repeat" &&
        existingMeal.repeatFromDay === startDay;

      if (index - startIndex < nights) {
        updatedMeals[day] = {
          name: "",
          recipeId: "",
          mealType: "repeat",
          repeatFromDay: startDay,
          ingredients: [],
        };
      } else if (repeatsStartDay) {
        updatedMeals[day] = createEmptyMeal();
      } else {
        break;
      }
    }

    setMealsByWeek({
      ...mealsByWeek,
      [mealWeekKey]: updatedMeals,
    });
  }

  // Reset a day to unplanned, along with any repeat days that pointed at it
  // (otherwise they'd dangle as "Same as <day>" with no source meal).
  function clearMealDay(day) {
    const updatedMeals = { ...meals, [day]: createEmptyMeal() };

    for (const otherDay of days) {
      const otherMeal = updatedMeals[otherDay];

      if (
        otherMeal?.mealType === "repeat" &&
        otherMeal.repeatFromDay === day
      ) {
        updatedMeals[otherDay] = createEmptyMeal();
      }
    }

    setMealsByWeek({
      ...mealsByWeek,
      [mealWeekKey]: updatedMeals,
    });
  }

  function updateMeal(day, updatedMeal) {
    const nextMeals = { ...meals, [day]: updatedMeal };

    // If this day is no longer a cooked meal, it can't feed leftovers — clear
    // the trailing days that were repeats pointing back at it, so they don't
    // dangle as "Leftovers from <day>" with no source dish.
    const stillCooked =
      (updatedMeal.mealType || "cook") === "cook" &&
      ((updatedMeal.name || "").trim() !== "" ||
        updatedMeal.recipeId ||
        (Array.isArray(updatedMeal.ingredients) &&
          updatedMeal.ingredients.length > 0));
    const dayIndex = days.indexOf(day);

    if (dayIndex >= 0 && !stillCooked) {
      for (let index = dayIndex + 1; index < days.length; index += 1) {
        const followingMeal = nextMeals[days[index]];

        if (
          followingMeal?.mealType === "repeat" &&
          followingMeal.repeatFromDay === day
        ) {
          nextMeals[days[index]] = createEmptyMeal();
        } else {
          break;
        }
      }
    }

    setMealsByWeek({
      ...mealsByWeek,
      [mealWeekKey]: nextMeals,
    });
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

  // Add a one-off item to the shopping list, with a chosen category and
  // priority tier. Manual items live in their own persisted slice and show
  // independent of the plan.
  // Add (or re-prioritise) a shopping item. Manual items are explicit
  // overrides, so adding one that's already on the list moves it to the chosen
  // category/priority rather than failing. Returns "added", "updated", or false.
  function addManualShoppingItem(name, category = "Other", tier = "soon") {
    const cleanedItem = name.trim();
    if (cleanedItem === "") return false;

    const normalised = normaliseItemName(cleanedItem);
    const cleanedCategory = (category || "Other").trim() || "Other";
    const cleanedTier = tier || "soon";

    const existingManual = manualShoppingItems.find(
      (item) => normaliseItemName(item.name) === normalised
    );
    const onList = unifiedItems.some(
      (item) => normaliseItemName(item.name) === normalised
    );

    if (existingManual) {
      setManualShoppingItems(
        manualShoppingItems.map((item) =>
          item.id === existingManual.id
            ? { ...item, category: cleanedCategory, tier: cleanedTier }
            : item
        )
      );
    } else {
      setManualShoppingItems([
        ...manualShoppingItems,
        {
          id: createCollectionId("manual", manualShoppingItems, cleanedItem),
          name: cleanedItem,
          category: cleanedCategory,
          tier: cleanedTier,
        },
      ]);
    }

    return onList ? "updated" : "added";
  }

  function addShoppingItem(category, priority) {
    const result = addManualShoppingItem(newItem, category, priority);
    if (result) setNewItem("");
    return result;
  }

  // Override the "already have" smarts: add a skipped ingredient as a manual
  // item so it appears on the list anyway.
  function addSkippedShoppingItem(name) {
    addManualShoppingItem(name);
  }

  function deleteShoppingItem(id) {
    setManualShoppingItems(
      manualShoppingItems.filter((item) => item.id !== id)
    );
  }

  // Tick an item off. Keyed by item identity so the state survives the list
  // being recomputed when the plan changes.
  function toggleShoppingChecked(id) {
    setShoppingChecked({
      ...shoppingChecked,
      [id]: !shoppingChecked[id],
    });
  }

  function setKeepStandingList(value) {
    setSettings({ ...settings, keepStandingList: value });
  }

  function setUsingSavedList(value) {
    setSettings({ ...settings, shopUsingSavedList: value });
  }

  // Tick a "take off your saved list" item once handled. Kept per week and
  // pruned to removals still present, so the set can't grow stale.
  function toggleRemovalAck(id) {
    const current = (removalAcksByWeek[currentWeekKey] || []).filter((ackId) =>
      removalIds.has(ackId)
    );
    const next = current.includes(id)
      ? current.filter((ackId) => ackId !== id)
      : [...current, id];

    setRemovalAcksByWeek({ ...removalAcksByWeek, [currentWeekKey]: next });
  }

  function addStaple(category = "Other") {
    const cleanedStaple = newStaple.trim();
    if (cleanedStaple === "") return;

    setStaples([
      ...staples,
      {
        id: createCollectionId("staple", staples, cleanedStaple),
        name: cleanedStaple,
        category: (category || "Other").trim() || "Other",
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

  function openShoppingList() {
    setActiveTab("shop");
  }

  function addInventoryItem(category = "Pantry") {
    const cleanedItem = newInventoryItem.trim();

    if (cleanedItem === "") return;

    setInventory([
      ...inventory,
      {
        id: createCollectionId("inventory", inventory, cleanedItem),
        name: cleanedItem,
        category: (category || "Pantry").trim() || "Pantry",
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

  function loadStarterStaples() {
    const existingNames = staples.map((staple) =>
      normaliseItemName(staple.name)
    );

    const starterStaples = initialStaples.filter(
      (staple) => !existingNames.includes(normaliseItemName(staple.name))
    );

    setStaples([...staples, ...starterStaples]);
  }

  function resetStockToStarterList() {
    const shouldReset = window.confirm(
      "Restore the default stock list? This removes your custom stock items and marks the default items as in stock."
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
        serves: 4,
      },
    ]);

    setNewRecipeName("");
  }

  function deleteRecipe(id) {
    const recipe = recipes.find((item) => item.id === id);
    const shouldDelete = window.confirm(
      `Delete "${recipe?.name || "this recipe"}"? Its ingredients and method will be removed. This can't be undone.`
    );

    if (!shouldDelete) return false;

    setRecipes(recipes.filter((item) => item.id !== id));
    return true;
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
    const has = (key) => Object.prototype.hasOwnProperty.call(backup, key);

    if (has("mealsByWeek")) setMealsByWeek(backup.mealsByWeek);
    if (has("shoppingItemsByWeek")) {
      setShoppingItemsByWeek(backup.shoppingItemsByWeek);
    }
    if (has("shoppingListMetaByWeek")) {
      setShoppingListMetaByWeek(backup.shoppingListMetaByWeek);
    }
    if (has("shoppingChecked")) setShoppingChecked(backup.shoppingChecked);
    if (has("manualShoppingItems")) {
      setManualShoppingItems(backup.manualShoppingItems);
    }
    if (has("settings")) setSettings(backup.settings);
    if (has("staples")) {
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
        <section className="screen home-screen">
          <TonightCard
            dayName={todayDayName}
            dateLabel={tonightDateLabel}
            summary={tonightSummary}
            coversNights={tonightCovers}
            leftoverDaysLabel={tonightLeftoverLabel}
            onOpenPlan={openTonightInPlan}
          />

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

            <p className="section-kicker">Planning week</p>
            <h2>
              {formatDate(mealWeekStart)} to {formatDate(mealWeekEnd)}
            </h2>
          </div>

          {showWelcome && (
            <div className="welcome-card">
              <button
                type="button"
                className="welcome-dismiss"
                aria-label="Dismiss"
                onClick={dismissWelcome}
              >
                ✕
              </button>

              <p className="section-kicker">Getting started</p>
              <strong>Here's how it works</strong>

              <ol className="welcome-steps">
                <li>
                  <span>Plan your week</span> — on Meals, pick a recipe for each
                  night. Cook once and reuse leftovers across several nights, or
                  mark a takeaway / night out.
                </li>
                <li>
                  <span>Set up household basics</span> — in Kitchen, list your
                  recurring buys (things you get most weeks) and tick what's
                  already in stock.
                </li>
                <li>
                  <span>Your shopping list builds itself</span> — the Shop page
                  lists your meal ingredients automatically, skips anything in
                  stock, and orders it by when you'll need it. Tap “How shopping
                  works” there for the full picture.
                </li>
                <li>
                  <span>Shop</span> — check items off as you go. The Today screen
                  always shows what's for dinner tonight.
                </li>
              </ol>

              <button
                type="button"
                className="primary-button welcome-cta"
                onClick={() => setActiveTab("plan")}
              >
                Start planning
              </button>
            </div>
          )}

          {homeWeekMode === "current" ? (
            <div className="home-dashboard">
              {comingUpDays.length > 0 && (
                <div className="home-week-ahead">
                  <div className="home-section-head">
                    <p className="section-kicker">Coming up this week</p>
                    <button
                      type="button"
                      className="home-link"
                      onClick={() => setActiveTab("plan")}
                    >
                      Full plan ›
                    </button>
                  </div>

                  <div className="meal-grid">
                    {renderMealGroups(comingUpDays, openHomeDayInPlan)}
                  </div>
                </div>
              )}

              <div className={`home-topup ${homeShopStatus.tone}`}>
                <div className="home-topup-body">
                  <p className="section-kicker">Shopping</p>
                  <strong>{homeShopStatus.title}</strong>
                  <span>{homeShopStatus.sub}</span>
                </div>

                {homeShopStatus.actionLabel && (
                  <button
                    type="button"
                    className={
                      homeShopStatus.tone === "needs"
                        ? "primary-button"
                        : "secondary"
                    }
                    onClick={homeShopStatus.onAction}
                  >
                    {homeShopStatus.actionLabel}
                  </button>
                )}
              </div>
            </div>
          ) : (
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

              <button
                className="home-step"
                type="button"
                onClick={() => openHousehold("stock")}
              >
                <span className="home-step-num">2</span>

                <span className="home-step-body">
                  <strong>Check stock &amp; recurring buys</strong>
                  <span>
                    {activeInventoryCount} in stock · {activeStaplesCount}{" "}
                    recurring
                  </span>
                </span>

                <span className="home-step-chevron">›</span>
              </button>

              <button
                className="home-step"
                type="button"
                onClick={() => setActiveTab("shop")}
              >
                <span className="home-step-num">3</span>

                <span className="home-step-body">
                  <strong>Shop</strong>
                  <span>
                    {unifiedPending} to buy · {unifiedItems.length - unifiedPending}{" "}
                    done
                  </span>
                </span>

                <span className="home-step-chevron">›</span>
              </button>
            </div>
          )}

          <div className="home-quicklinks">
            <p className="section-kicker">Set up</p>

            <div className="home-actions">
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
          <div className="page-hero plan-hero">
            <p className="page-hero-kicker">
              Meal plan · {formatDate(mealWeekStart)} – {formatDate(mealWeekEnd)}
            </p>

            <strong className="page-hero-count">
              {mealsPlannedCount} of {days.length} dinners planned
            </strong>

            <p className="page-hero-sub">{planGapsLabel}</p>

            {firstUnplannedDay && (
              <button
                type="button"
                className="page-hero-action"
                onClick={() => setExpandedMealDay(firstUnplannedDay)}
              >
                Plan {firstUnplannedDay}
              </button>
            )}
          </div>

          <WeekControls
            activePreset={mealWeekMode}
            onThisWeek={goToThisMealWeek}
            onNextWeekPreset={goToNextMealWeekDefault}
            onPreviousWeek={goToPreviousMealWeek}
            onNextWeek={goToNextMealWeek}
          />

          <div className="meal-grid">
            {renderMealGroups(days, setExpandedMealDay)}
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
              leftoverNights={expandedLeftoverNights}
              maxNights={expandedMaxNights}
              onSetNights={(nights) =>
                setLeftoverNights(expandedMealDay, nights)
              }
              onClearDay={() => clearMealDay(expandedMealDay)}
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
                  <span className="home-step-chevron">›</span>
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
                  <span className="home-step-chevron">›</span>
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
                  <span className="home-step-chevron">›</span>
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
            </>
          )}
        </section>
      )}

      {activeTab === "settings" && (
        <section className="screen settings-screen">
          <button
            type="button"
            className="back-button"
            onClick={closeSettings}
          >
            <ChevronLeft size={18} aria-hidden="true" />
            Back
          </button>

          <SettingsPanel
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
            onResetWelcome={() => {
              setWelcomePreview(true);
              setWelcomeDismissedFor(null);
              setActiveTab("home");
            }}
          />
        </section>
      )}

      {shoppingHelpOpen && (
        <ShoppingHelpSheet
          keepStandingList={keepStandingList}
          onClose={() => setShoppingHelpOpen(false)}
        />
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
