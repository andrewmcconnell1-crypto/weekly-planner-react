import { useEffect, useState } from "react";
import "./App.css";

import HouseholdBasics from "./components/HouseholdBasics";
import MealCard from "./components/MealCard";
import ShoppingList from "./components/ShoppingList";

import { createEmptyMeals, days } from "./utils/mealUtils";

import {
  getSunday,
  getNextSunday,
  formatDate,
  getWeekKey,
} from "./utils/dateUtils";

import { initialStaples } from "./data/initialStaples";

import { normaliseItemName } from "./utils/itemUtils";
import { commonInventoryItems } from "./data/commonInventory";

import RecipesList from "./components/RecipesList";
import { initialRecipes } from "./data/initialRecipes";
import { getRecipeTone } from "./utils/recipeUtils";

const recipeIdAliases = {
  "spaghetti-bolognese": "bolognese",
};

const emptyMeal = {
  name: "",
  recipeId: "",
  mealType: "cook",
  repeatFromDay: "",
  ingredients: [],
};

function slugifyIdPart(value) {
  return normaliseItemName(value).replace(/\s+/g, "-") || "item";
}

function createCollectionId(prefix, collection, name) {
  const existingIds = new Set(collection.map((item) => item.id));
  const baseId = `${prefix}-${slugifyIdPart(name)}`;

  if (!existingIds.has(baseId)) return baseId;

  let suffix = 2;
  let nextId = `${baseId}-${suffix}`;

  while (existingIds.has(nextId)) {
    suffix += 1;
    nextId = `${baseId}-${suffix}`;
  }

  return nextId;
}

const durableInventoryItemsByName = new Map(
  commonInventoryItems.map((item) => [normaliseItemName(item.name), item])
);

function normaliseInventoryItems(inventoryItems) {
  if (!Array.isArray(inventoryItems)) return [];

  return inventoryItems
    .filter((item) => {
      const isStarterInventoryItem = String(item.id || "").startsWith(
        "starter-inventory-"
      );
      const starterItem = durableInventoryItemsByName.get(
        normaliseItemName(item.name || "")
      );

      if (!isStarterInventoryItem) return true;

      return Boolean(starterItem);
    })
    .map((item) => ({
      ...item,
      category:
        String(item.id || "").startsWith("starter-inventory-")
          ? durableInventoryItemsByName.get(normaliseItemName(item.name || ""))
            ?.category || item.category
          : item.category,
      active: String(item.id || "").startsWith("starter-inventory-")
        ? true
        : item.active ?? true,
    }));
}

function normaliseRecipe(recipe, index) {
  const recipeId = recipeIdAliases[recipe.id] || recipe.id;
  const starterRecipe = initialRecipes.find(
    (initialRecipe) => initialRecipe.id === recipeId
  );

  if (starterRecipe) {
    return starterRecipe;
  }

  return {
    id:
      recipeId ||
      `recipe-${index}-${recipe.name || "untitled"}`,
    name: recipe.name || "Untitled recipe",
    category: recipe.category || "Family favourites",
    source: recipe.source || "",
    sourceUrl: recipe.sourceUrl || "",
    ingredients: Array.isArray(recipe.ingredients)
      ? recipe.ingredients
      : [],
    method: recipe.method || "",
  };
}

function loadRecipes() {
  const savedRecipes = localStorage.getItem("recipes");

  if (!savedRecipes) return initialRecipes;

  const parsedRecipes = JSON.parse(savedRecipes);
  const normalisedRecipes = parsedRecipes.map(normaliseRecipe);
  const savedRecipeIds = new Set(
    normalisedRecipes.map((recipe) => recipe.id)
  );
  const missingStarterRecipes = initialRecipes.filter(
    (recipe) => !savedRecipeIds.has(recipe.id)
  );

  return [...normalisedRecipes, ...missingStarterRecipes];
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

  const [mealsByWeek, setMealsByWeek] = useState(() => {
    const savedMeals = localStorage.getItem("mealsByWeek");
    return savedMeals ? JSON.parse(savedMeals) : {};
  });

  const [shoppingItemsByWeek, setShoppingItemsByWeek] = useState(() => {
    const savedItems = localStorage.getItem("shoppingItemsByWeek");
    return savedItems ? JSON.parse(savedItems) : {};
  });

  const [staples, setStaples] = useState(() => {
    const savedStaples = localStorage.getItem("staples");
    return savedStaples ? JSON.parse(savedStaples) : initialStaples;
  });

  const [newItem, setNewItem] = useState("");
  const [newStaple, setNewStaple] = useState("");

  const [inventory, setInventory] = useState(() => {
    const savedInventory = localStorage.getItem("inventory");
    return savedInventory
      ? normaliseInventoryItems(JSON.parse(savedInventory))
      : [];
  });

  const [newInventoryItem, setNewInventoryItem] = useState("");
  const [recipes, setRecipes] = useState(loadRecipes);
  const [newRecipeName, setNewRecipeName] = useState("");

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

  const meals = mealsByWeek[mealWeekKey] || createEmptyMeals();
  const shoppingWeekMeals =
    mealsByWeek[shoppingWeekKey] || createEmptyMeals();
  const shoppingItems = shoppingItemsByWeek[shoppingWeekKey] || [];

  function getMealType(meal) {
    if (!meal) return "cook";
    if (meal.mealType) return meal.mealType;
    return "cook";
  }

  function getRecipeForMeal(meal) {
    if (!meal) return null;
    if (getMealType(meal) !== "cook") return null;

    if (meal.recipeId) {
      const linkedRecipe = recipes.find((recipe) => recipe.id === meal.recipeId);

      if (linkedRecipe) return linkedRecipe;
    }

    const normalisedMealName = normaliseItemName(meal.name || "");

    if (!normalisedMealName) return null;

    return (
      recipes.find(
        (recipe) => normaliseItemName(recipe.name) === normalisedMealName
      ) || null
    );
  }

  function getIngredientsForMeal(meal) {
    if (getMealType(meal) !== "cook") return [];

    const linkedRecipe = getRecipeForMeal(meal);
    const recipeIngredients = linkedRecipe?.ingredients || [];
    const mealIngredients = Array.isArray(meal?.ingredients)
      ? meal.ingredients
      : [];
    const seenIngredients = new Set();

    return [...recipeIngredients, ...mealIngredients].filter((ingredient) => {
      const cleanedIngredient = String(ingredient).trim();

      if (!cleanedIngredient) return false;

      const normalisedIngredient = normaliseItemName(cleanedIngredient);

      if (seenIngredients.has(normalisedIngredient)) {
        return false;
      }

      seenIngredients.add(normalisedIngredient);
      return true;
    });
  }

  function getMealDisplayName(meal, linkedRecipe, weekMeals) {
    const mealType = getMealType(meal);

    if (mealType === "takeaway") return "Takeaway";
    if (mealType === "eating-out") return "Eating out";

    if (mealType === "repeat") {
      const repeatFromDay = meal?.repeatFromDay;
      const sourceMeal = repeatFromDay ? weekMeals[repeatFromDay] : null;
      const sourceMealType = getMealType(sourceMeal);
      const sourceRecipe = getRecipeForMeal(sourceMeal);
      const sourceName =
        sourceMeal && sourceMealType !== "repeat"
          ? getMealDisplayName(sourceMeal, sourceRecipe, weekMeals)
          : "";

      if (sourceName && sourceName !== "No meal planned") {
        return `Same as ${repeatFromDay}: ${sourceName}`;
      }

      return repeatFromDay ? `Same as ${repeatFromDay}` : "Same as another night";
    }

    return linkedRecipe?.name || (meal?.name || "").trim() || "No meal planned";
  }

  function getMealLabel(meal, linkedRecipe) {
    const mealType = getMealType(meal);
    const hasCustomMeal =
      (meal?.name || "").trim() !== "" || Boolean(meal?.ingredients?.length);

    if (mealType === "takeaway") return "No shopping needed";
    if (mealType === "eating-out") return "No shopping needed";
    if (mealType === "repeat") return "Repeat meal";
    if (linkedRecipe) return linkedRecipe.category || "Recipe";
    return hasCustomMeal ? "Custom meal" : "Unplanned";
  }

  function getMealTone(meal, linkedRecipe, hasMeal) {
    const mealType = getMealType(meal);

    if (!hasMeal) return "empty";
    if (mealType === "repeat") return "repeat";
    if (mealType === "takeaway") return "takeaway";
    if (mealType === "eating-out") return "out";
    if (linkedRecipe) return getRecipeTone(linkedRecipe.category);

    return "custom";
  }

  function mealHasPlan(meal) {
    const mealType = getMealType(meal);

    if (mealType === "takeaway" || mealType === "eating-out") return true;
    if (mealType === "repeat") return Boolean(meal?.repeatFromDay);

    return (
      (meal?.name || "").trim() !== "" ||
      getIngredientsForMeal(meal).length > 0
    );
  }

  function getMealSummary(day, meal, weekMeals = meals) {
    const normalisedMeal = meal || emptyMeal;
    const linkedRecipe = getRecipeForMeal(normalisedMeal);
    const ingredients = getIngredientsForMeal(normalisedMeal);
    const hasMeal = mealHasPlan(normalisedMeal);

    return {
      day,
      meal: normalisedMeal,
      linkedRecipe,
      ingredients,
      hasMeal,
      name: getMealDisplayName(normalisedMeal, linkedRecipe, weekMeals),
      label: getMealLabel(normalisedMeal, linkedRecipe),
      tone: getMealTone(normalisedMeal, linkedRecipe, hasMeal),
    };
  }

  const mealWeekEnd = new Date(mealWeekStart);
  mealWeekEnd.setDate(mealWeekStart.getDate() + 6);

  const shoppingWeekEnd = new Date(shoppingWeekStart);
  shoppingWeekEnd.setDate(shoppingWeekStart.getDate() + 6);

  const planningDaySummaries = days.map((day) =>
    getMealSummary(day, meals[day], meals)
  );
  const shoppingDaySummaries = days.map((day) =>
    getMealSummary(day, shoppingWeekMeals[day], shoppingWeekMeals)
  );
  const mealsPlannedCount = planningDaySummaries.filter(
    (daySummary) => daySummary.hasMeal
  ).length;
  const shoppingMealIngredientsCount = shoppingDaySummaries.reduce(
    (total, daySummary) => total + daySummary.ingredients.length,
    0
  );

  const activeStaplesCount = staples.filter(
    (staple) => staple.active !== false
  ).length;

  const dueStaplesCount = staples.filter(
    (staple) => staple.active !== false && stapleIsDueThisWeek(staple)
  ).length;

  const activeInventoryCount = inventory.filter(
    (item) => item.active !== false
  ).length;
  const shoppingItemsCount = shoppingItems.length;
  const pendingShoppingItemsCount = shoppingItems.filter(
    (item) => !item.checked
  ).length;
  const checkedShoppingItemsCount = shoppingItemsCount - pendingShoppingItemsCount;
  const shoppingActionLabel =
    shoppingItemsCount > 0 ? "Update shopping list" : "Generate shopping list";

  useEffect(() => {
    localStorage.setItem("mealsByWeek", JSON.stringify(mealsByWeek));
  }, [mealsByWeek]);

  useEffect(() => {
    localStorage.setItem(
      "shoppingItemsByWeek",
      JSON.stringify(shoppingItemsByWeek)
    );
  }, [shoppingItemsByWeek]);

  useEffect(() => {
    localStorage.setItem("staples", JSON.stringify(staples));
  }, [staples]);

  useEffect(() => {
    localStorage.setItem("inventory", JSON.stringify(inventory));
  }, [inventory]);

  useEffect(() => {
    localStorage.setItem("recipes", JSON.stringify(recipes));
  }, [recipes]);

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

  function toggleExpandedMealDay(day) {
    setExpandedMealDay(expandedMealDay === day ? null : day);
  }

  function openPlanDay(day) {
    setExpandedMealDay(day);
    setActiveTab("plan");
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

  function toggleStapleActive(id) {
    setStaples(
      staples.map((staple) =>
        staple.id === id ? { ...staple, active: !staple.active } : staple
      )
    );
  }

  function stapleIsDueThisWeek(staple) {
    if (staple.frequency === "ad-hoc") return false;
    if (!staple.frequency) return true;
    if (!staple.startDate) return true;

    const start = new Date(staple.startDate);
    const current = new Date(shoppingWeekKey);

    if (Number.isNaN(start.getTime())) return true;

    const weeksSinceStart = Math.floor(
      (current - start) / (7 * 24 * 60 * 60 * 1000)
    );

    if (weeksSinceStart < 0) return false;

    if (staple.frequency === "weekly") return true;
    if (staple.frequency === "fortnightly") return weeksSinceStart % 2 === 0;
    if (staple.frequency === "four-weekly") return weeksSinceStart % 4 === 0;

    return true;
  }

  function buildShoppingList() {
    const dueStaples = staples
      .filter(
        (staple) =>
          staple.active !== false &&
          stapleIsDueThisWeek(staple)
      )
      .map((staple) => ({
        name: staple.quantity
          ? `${staple.quantity} ${staple.unit} ${staple.name}`
          : staple.name,
        category: staple.category || "Other",
        source: "Recurring buy",
        sourceDetail: staple.name,
      }));

    const restockInventory = inventory
      .filter((item) => item.active === false)
      .map((item) => ({
        name: item.quantity
          ? `${item.quantity} ${item.unit} ${item.name}`
          : item.name,
        category: item.category || "Household",
        source: "Restock",
        sourceDetail: "Stock",
      }));

    const mealIngredients = days.flatMap((day) => {
      const daySummary = getMealSummary(day, shoppingWeekMeals[day], shoppingWeekMeals);
      const sourceDetail = daySummary.hasMeal ? daySummary.name : day;

      return daySummary.ingredients.map((ingredient) => ({
        name: ingredient,
        category: "Meal ingredients",
        source: "Meal",
        sourceDetail,
        day,
      }));
    });

    const allNewItems = [
      ...dueStaples,
      ...restockInventory,
      ...mealIngredients,
    ];

    const generatedSources = [
      "Meal",
      "Staple",
      "Recurring buy",
      "Restock",
      "Generated",
    ];
    const existingGeneratedItems = shoppingItems.filter((item) =>
      generatedSources.includes(item.source)
    );
    const retainedShoppingItems = shoppingItems.filter(
      (item) => !generatedSources.includes(item.source)
    );
    const existingGeneratedItemsByName = new Map(
      existingGeneratedItems.map((item) => [
        normaliseItemName(item.name),
        item,
      ])
    );
    const existingNames = [
      ...retainedShoppingItems.map((item) => normaliseItemName(item.name)),
      ...inventory
        .filter((item) => item.active !== false)
        .map((item) => normaliseItemName(item.name)),
    ];

    const seenNames = new Set(existingNames);

    const newItems = allNewItems
      .filter((item) => {
        const normalisedName = normaliseItemName(
          item.name
        );

        if (seenNames.has(normalisedName)) {
          return false;
        }

        seenNames.add(normalisedName);
        return true;
      })
      .map((item) => ({
        id:
          existingGeneratedItemsByName.get(normaliseItemName(item.name))?.id ||
          `generated-${slugifyIdPart(item.name)}`,
        name: item.name,
        category: item.category,
        source: item.source || "Generated",
        sourceDetail: item.sourceDetail || "",
        day: item.day || "",
        checked:
          existingGeneratedItemsByName.get(normaliseItemName(item.name))
            ?.checked || false,
      }));

    setShoppingItemsByWeek({
      ...shoppingItemsByWeek,
      [shoppingWeekKey]: [...retainedShoppingItems, ...newItems],
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

    const starterItems = commonInventoryItems
      .filter(
        (item) =>
          !existingNames.includes(normaliseItemName(item.name))
      )
      .map((item) => ({
        id: `starter-inventory-${slugifyIdPart(item.name)}`,
        name: item.name,
        category: item.category,
        quantity: null,
        unit: "",
        active: true,
      }));

    setInventory([...inventory, ...starterItems]);
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
    setRecipes(recipes.filter((recipe) => recipe.id !== id));
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

  function updateRecipeMethod(recipeId, method) {
    setRecipes(
      recipes.map((recipe) =>
        recipe.id === recipeId ? { ...recipe, method } : recipe
      )
    );
  }

  return (
    <main className="app-shell">
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

      {activeTab === "home" && (
        <section className="screen home-screen">
          <div className="home-hero">
            <div>
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

              <p className="section-kicker">Next shop</p>
              <h2>
                {formatDate(shoppingWeekStart)} to {formatDate(shoppingWeekEnd)}
              </h2>
              <p>
                {mealsPlannedCount} of {days.length} meals planned,{" "}
                {dueStaplesCount} regular buys due, {pendingShoppingItemsCount} items
                still to buy.
              </p>
            </div>

            <div className="home-status">
              <strong>{pendingShoppingItemsCount}</strong>
              <span>to buy</span>
            </div>
          </div>

          <div className="home-primary-row">
            <button className="primary-button" onClick={buildShoppingList}>
              {shoppingActionLabel}
            </button>

            <button className="secondary" onClick={() => setActiveTab("shop")}>
              Open list
            </button>
          </div>

          <div className="home-workflow">
            <section className="workflow-panel">
              <div className="workflow-heading">
                <div>
                  <p className="section-kicker">Meals</p>
                  <h2>Plan</h2>
                </div>

                <span className="workflow-count">
                  {mealsPlannedCount}/{days.length}
                </span>
              </div>

              <div className="date-line">
                {formatDate(mealWeekStart)} to {formatDate(mealWeekEnd)}
              </div>

              <div className="home-week-list">
                {planningDaySummaries.map((daySummary) => (
                  <button
                    className={`home-day-row ${
                      daySummary.hasMeal ? "" : "empty"
                    }`}
                    data-tone={daySummary.tone}
                    type="button"
                    key={daySummary.day}
                    onClick={() => openPlanDay(daySummary.day)}
                  >
                    <span className="home-day">{daySummary.day.slice(0, 3)}</span>

                    <span className="home-meal">
                      <strong>{daySummary.name}</strong>
                      <span>{daySummary.label}</span>
                    </span>

                    <span className="meal-row-count">
                      {daySummary.ingredients.length}
                    </span>
                  </button>
                ))}
              </div>

              <button className="secondary" onClick={() => setActiveTab("plan")}>
                Edit meal plan
              </button>
            </section>

            <section className="workflow-panel">
              <div className="workflow-heading">
                <div>
                  <p className="section-kicker">Shop</p>
                  <h2>Readiness</h2>
                </div>

                <span className="workflow-count">
                  {shoppingItemsCount}
                </span>
              </div>

              <div className="readiness-list">
                <div>
                  <span>Meal ingredients</span>
                  <strong>{shoppingMealIngredientsCount}</strong>
                </div>

                <div>
                  <span>Regular buys due</span>
                  <strong>{dueStaplesCount}</strong>
                </div>

                <div>
                  <span>In stock</span>
                  <strong>{activeInventoryCount}</strong>
                </div>

                <div>
                  <span>Checked off</span>
                  <strong>{checkedShoppingItemsCount}</strong>
                </div>
              </div>

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
            </section>
          </div>
        </section>
      )}

      {activeTab === "plan" && (
        <section className="screen">
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

          <div className="week-nav">
            <button className="secondary" onClick={goToPreviousMealWeek}>
              Previous
            </button>

            <button onClick={goToNextMealWeekDefault}>Next shop</button>

            <button className="secondary" onClick={goToThisMealWeek}>
              This week
            </button>

            <button className="secondary" onClick={goToNextMealWeek}>
              Next
            </button>
          </div>

          <div className="meal-grid">
            {days.map((day) => {
              const meal = meals[day];
              const daySummary = getMealSummary(day, meal, meals);

              return (
                <MealCard
                  key={day}
                  day={day}
                  meal={meal}
                  days={days}
                  recipes={recipes}
                  linkedRecipe={daySummary.linkedRecipe}
                  displayName={daySummary.name}
                  mealLabel={daySummary.label}
                  mealTone={daySummary.tone}
                  ingredientCount={daySummary.ingredients.length}
                  updateMeal={updateMeal}
                  isExpanded={expandedMealDay === day}
                  toggleExpanded={() => toggleExpandedMealDay(day)}
                  weekDaySummaries={planningDaySummaries}
                />
              );
            })}
          </div>
        </section>
      )}

      {activeTab === "shop" && (
        <ShoppingList
          newItem={newItem}
          setNewItem={setNewItem}
          addShoppingItem={addShoppingItem}
          shoppingItems={shoppingItems}
          toggleShoppingItem={toggleShoppingItem}
          deleteShoppingItem={deleteShoppingItem}
          buildShoppingList={buildShoppingList}
          shoppingActionLabel={shoppingActionLabel}
          pendingShoppingItemsCount={pendingShoppingItemsCount}
          checkedShoppingItemsCount={checkedShoppingItemsCount}
          shoppingWeekStart={shoppingWeekStart}
          shoppingWeekEnd={shoppingWeekEnd}
          goToPreviousShoppingWeek={goToPreviousShoppingWeek}
          goToNextShoppingWeekDefault={goToNextShoppingWeekDefault}
          goToNextShoppingWeek={goToNextShoppingWeek}
        />
      )}

      {activeTab === "more" && (
        <section className="screen">
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
                  <span>Preferences placeholder</span>
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
                  updateRecipeMethod={updateRecipeMethod}
                />
              )}

              {moreSection === "settings" && (
                <div className="settings-placeholder">
                  <strong>Settings</strong>
                  <p className="small-text">Settings will live here later.</p>
                </div>
              )}
            </>
          )}
        </section>
      )}

      <nav className="bottom-nav" aria-label="Primary">
        <button
          className={activeTab === "home" ? "active" : ""}
          onClick={() => setActiveTab("home")}
        >
          Home
        </button>

        <button
          className={activeTab === "plan" ? "active" : ""}
          onClick={() => setActiveTab("plan")}
        >
          Plan
        </button>

        <button
          className={activeTab === "shop" ? "active" : ""}
          onClick={() => setActiveTab("shop")}
        >
          Shop
        </button>

        <button
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
