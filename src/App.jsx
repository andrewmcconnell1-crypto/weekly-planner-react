import { useEffect, useMemo, useState } from "react";
import {
  House,
  CalendarDays,
  ShoppingBasket,
  LayoutGrid,
} from "lucide-react";
import "./App.css";

import HouseholdBasics from "./components/HouseholdBasics";
import MealCard from "./components/MealCard";
import MealEditorSheet from "./components/MealEditorSheet";
import MealLeftoverCluster from "./components/MealLeftoverCluster";
import TonightCard from "./components/TonightCard";
import ShoppingList from "./components/ShoppingList";
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
  const [welcomeDismissed, setWelcomeDismissed] = useState(
    () => localStorage.getItem("planner-welcome-done") === "1"
  );
  const [welcomePreview, setWelcomePreview] = useState(false);

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
    removalAcksByWeek,
    setRemovalAcksByWeek,
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

  // Whether the user has completed the full workflow (plan -> generate -> check).
  // Derived rather than stored, so we never call setState inside an effect.
  const welcomeWorkflowComplete =
    Object.values(mealsByWeek).some((weekMeals) =>
      days.some((d) => {
        const m = weekMeals?.[d];
        return (
          m && (m.name || m.recipeId || (m.mealType && m.mealType !== "cook"))
        );
      })
    ) &&
    Object.keys(shoppingListMetaByWeek).length > 0 &&
    Object.values(shoppingItemsByWeek).some(
      (items) => Array.isArray(items) && items.some((i) => i.checked)
    );

  // Persist that the welcome has served its purpose (side-effect only).
  useEffect(() => {
    if (welcomeWorkflowComplete && !welcomePreview) {
      localStorage.setItem("planner-welcome-done", "1");
    }
  }, [welcomeWorkflowComplete, welcomePreview]);

  const showWelcome =
    !welcomeDismissed && (welcomePreview || !welcomeWorkflowComplete);

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
  // The planning week (Meals tab) and shopping week (Shop tab) move
  // independently; flag when they've drifted apart so each screen can offer to
  // realign them.
  const weeksDiverged = mealWeekKey !== shoppingWeekKey;

  const meals = mealsByWeek[mealWeekKey] || createEmptyMeals();
  const shoppingWeekMeals =
    mealsByWeek[shoppingWeekKey] || createEmptyMeals();
  const shoppingItems = shoppingItemsByWeek[shoppingWeekKey] || [];

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

  // Is there a previous week worth copying? (Drives whether we offer the
  // "Copy last week's plan" shortcut at all.)
  const previousMealWeekStart = new Date(mealWeekStart);
  previousMealWeekStart.setDate(mealWeekStart.getDate() - 7);
  const previousMealWeekMeals =
    mealsByWeek[getWeekKey(previousMealWeekStart)];
  const hasPreviousWeekPlan = Boolean(
    previousMealWeekMeals &&
      days.some((day) => {
        const previousMeal = previousMealWeekMeals[day];

        return (
          previousMeal &&
          (previousMeal.name ||
            previousMeal.recipeId ||
            (previousMeal.mealType && previousMeal.mealType !== "cook"))
        );
      })
  );

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
  const recurringRemovalItems = shoppingListPlan.removeFromRecurring;
  const skippedShoppingItems = shoppingListPlan.skippedItems;
  // Which removals the user has ticked off (handled in their Woolworths list),
  // limited to removals still present this week.
  const currentRemovalIds = new Set(
    recurringRemovalItems.map((item) => item.id)
  );
  const removalAckIds = (removalAcksByWeek[shoppingWeekKey] || []).filter((id) =>
    currentRemovalIds.has(id)
  );
  const pendingRemovalCount = recurringRemovalItems.filter(
    (item) => !removalAckIds.includes(item.id)
  ).length;
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

  function openTonightInPlan() {
    setMealWeekStart(new Date(currentWeekStart));
    setExpandedMealDay(todayDayName);
    setActiveTab("plan");
  }

  function dismissWelcome() {
    setWelcomePreview(false);
    localStorage.setItem("planner-welcome-done", "1");
    setWelcomeDismissed(true);
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

  // Pull the shopping week onto the planning week, so the list reflects the
  // meals you've just been editing.
  function alignShoppingToPlan() {
    setShoppingWeekStart(new Date(mealWeekStart));
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

  // Override the "already have" smarts: put a skipped ingredient back on the
  // list as a manual item (which the generator then preserves).
  function addSkippedShoppingItem(name) {
    const cleanedItem = name.trim();
    if (cleanedItem === "") return;

    const alreadyOnList = shoppingItems.some(
      (item) => normaliseItemName(item.name) === normaliseItemName(cleanedItem)
    );
    if (alreadyOnList) return;

    setShoppingItemsByWeek({
      ...shoppingItemsByWeek,
      [shoppingWeekKey]: [
        ...shoppingItems,
        {
          id: createCollectionId("shopping", shoppingItems, cleanedItem),
          name: cleanedItem,
          category: "Meal ingredients",
          source: "Manual",
          checked: false,
        },
      ],
    });
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

  // Tick a "remove from Woolworths list" item off once it's been handled. We
  // prune acks down to removals still present, so the stored set can't grow
  // stale or silently dismiss a removal that later returns.
  function toggleRemovalAck(id) {
    const current = (removalAcksByWeek[shoppingWeekKey] || []).filter((ackId) =>
      currentRemovalIds.has(ackId)
    );
    const next = current.includes(id)
      ? current.filter((ackId) => ackId !== id)
      : [...current, id];

    setRemovalAcksByWeek({
      ...removalAcksByWeek,
      [shoppingWeekKey]: next,
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
    if (Object.prototype.hasOwnProperty.call(backup, "mealsByWeek")) {
      setMealsByWeek(backup.mealsByWeek);
    }
    if (Object.prototype.hasOwnProperty.call(backup, "shoppingItemsByWeek")) {
      setShoppingItemsByWeek(backup.shoppingItemsByWeek);
    }
    if (Object.prototype.hasOwnProperty.call(backup, "shoppingListMetaByWeek")) {
      setShoppingListMetaByWeek(backup.shoppingListMetaByWeek);
    }
    if (Object.prototype.hasOwnProperty.call(backup, "removalAcksByWeek")) {
      setRemovalAcksByWeek(backup.removalAcksByWeek);
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
              ? "Today"
              : activeTab === "shop"
              ? "Shopping list"
              : activeTab === "more"
                ? "More"
                : "Meals"}
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

            <p className="section-kicker">Shopping week</p>
            <h2>
              {formatDate(shoppingWeekStart)} to {formatDate(shoppingWeekEnd)}
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
                <li><span>Plan</span> your dinners for the week</li>
                <li><span>Generate</span> a shopping list from your meals and recurring buys</li>
                <li><span>Shop</span> and check items off as you go</li>
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

            <div className="home-step-action">
              <div className="home-step-head">
                <span className="home-step-num">3</span>

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
              <span className="home-step-num">4</span>

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

          {weeksDiverged && (
            <div className="week-mismatch" role="status">
              <span>
                You're planning {formatDate(mealWeekStart)} –{" "}
                {formatDate(mealWeekEnd)}, but your shopping list is set to{" "}
                {formatDate(shoppingWeekStart)} – {formatDate(shoppingWeekEnd)}.
              </span>

              <button
                type="button"
                className="secondary"
                onClick={alignShoppingToPlan}
              >
                Shop this week
              </button>
            </div>
          )}

          {hasPreviousWeekPlan && (
            <button
              className="secondary copy-week-button"
              type="button"
              onClick={copyPreviousWeekMeals}
            >
              Copy last week's plan
            </button>
          )}

          <div className="meal-grid">
            {(() => {
              // Group each cook day with the run of leftover (repeat) days that
              // immediately follow it, so they render as one merged cluster.
              const groups = [];
              for (let i = 0; i < days.length; ) {
                const day = days[i];
                const meal = meals[day];
                const repeatDays = [];

                if (
                  planningDaySummaries[i].hasMeal &&
                  (meal?.mealType || "cook") === "cook"
                ) {
                  for (let j = i + 1; j < days.length; j += 1) {
                    const next = meals[days[j]];

                    if (
                      next?.mealType === "repeat" &&
                      next.repeatFromDay === day
                    ) {
                      repeatDays.push(days[j]);
                    } else {
                      break;
                    }
                  }
                }

                groups.push({ leadDay: day, repeatDays });
                i += 1 + repeatDays.length;
              }

              return groups.map((group) => {
                const leadSummary = getMealSummary(
                  group.leadDay,
                  meals[group.leadDay],
                  meals
                );

                if (group.repeatDays.length === 0) {
                  return (
                    <MealCard
                      key={group.leadDay}
                      day={group.leadDay}
                      meal={meals[group.leadDay]}
                      displayName={leadSummary.name}
                      mealLabel={leadSummary.label}
                      mealTone={leadSummary.tone}
                      hasMeal={leadSummary.hasMeal}
                      onOpen={() => setExpandedMealDay(group.leadDay)}
                    />
                  );
                }

                return (
                  <MealLeftoverCluster
                    key={group.leadDay}
                    leadDay={group.leadDay}
                    leadSummary={leadSummary}
                    repeatDays={group.repeatDays}
                    onOpenDay={(targetDay) => setExpandedMealDay(targetDay)}
                  />
                );
              });
            })()}
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
          shoppingItems={visibleShoppingItems}
          toggleShoppingItem={toggleShoppingItem}
          deleteShoppingItem={deleteShoppingItem}
          buildShoppingList={buildShoppingList}
          shoppingActionLabel={shoppingActionLabel}
          shoppingListNeedsUpdate={shoppingListNeedsUpdate}
          hasGeneratedShopPlan={hasGeneratedShopPlan}
          shoppingLastUpdatedText={shoppingLastUpdatedText}
          recurringRemovalItems={recurringRemovalItems}
          removalAckIds={removalAckIds}
          pendingRemovalCount={pendingRemovalCount}
          onToggleRemoval={toggleRemovalAck}
          skippedItems={skippedShoppingItems}
          onAddSkipped={addSkippedShoppingItem}
          weeksDiverged={weeksDiverged}
          plannedWeekLabel={`${formatDate(mealWeekStart)} – ${formatDate(
            mealWeekEnd
          )}`}
          onShopPlannedWeek={alignShoppingToPlan}
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
                  resetStockToStarterList={resetStockToStarterList}
                  onResetWelcome={() => {
                    setWelcomePreview(true);
                    localStorage.removeItem("planner-welcome-done");
                    setWelcomeDismissed(false);
                    setActiveTab("home");
                  }}
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
          <LayoutGrid size={21} strokeWidth={2} aria-hidden="true" />
          <span>More</span>
        </button>
      </nav>
    </main>
  );
}

export default App;
