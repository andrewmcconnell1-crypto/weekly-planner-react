import { useEffect, useState } from "react";
import "./App.css";

import MealCard from "./components/MealCard";
import ShoppingList from "./components/ShoppingList";
import StaplesList from "./components/StaplesList";

import { createEmptyMeals, days } from "./utils/mealUtils";

import {
  getSunday,
  getNextSunday,
  formatDate,
  getWeekKey,
} from "./utils/dateUtils";

import { initialStaples } from "./data/initialStaples";

import { normaliseItemName } from "./utils/itemUtils";
import InventoryList from "./components/InventoryList";
import { commonInventoryItems } from "./data/commonInventory";

function App() {
  const [activeTab, setActiveTab] = useState("home");
  const [moreSection, setMoreSection] = useState("overview");
  const [expandedMealDay, setExpandedMealDay] = useState(null);

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
    return savedInventory ? JSON.parse(savedInventory) : [];
  });

  const [newInventoryItem, setNewInventoryItem] = useState("");

  const mealWeekKey = getWeekKey(mealWeekStart);
  const shoppingWeekKey = getWeekKey(shoppingWeekStart);

  const meals = mealsByWeek[mealWeekKey] || createEmptyMeals();
  const shoppingWeekMeals =
    mealsByWeek[shoppingWeekKey] || createEmptyMeals();
  const shoppingItems = shoppingItemsByWeek[shoppingWeekKey] || [];

  const mealWeekEnd = new Date(mealWeekStart);
  mealWeekEnd.setDate(mealWeekStart.getDate() + 6);

  const shoppingWeekEnd = new Date(shoppingWeekStart);
  shoppingWeekEnd.setDate(shoppingWeekStart.getDate() + 6);

  const mealsPlannedCount = days.filter((day) => {
    const meal = meals[day];
    return meal.name.trim() !== "" || meal.ingredients.length > 0;
  }).length;

  const activeStaplesCount = staples.filter(
    (staple) => staple.active !== false
  ).length;

  const inventoryItemsCount = inventory.length;
  const activeInventoryCount = inventory.filter(
    (item) => item.active !== false
  ).length;
  const shoppingItemsCount = shoppingItems.length;

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

  function addShoppingItem() {
    const cleanedItem = newItem.trim();
    if (cleanedItem === "") return;

    const updatedItems = [
      ...shoppingItems,
      {
        id: Date.now().toString(),
        name: cleanedItem,
        category: "Other",
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
        id: Date.now().toString(),
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
      }));

    const mealIngredients = days.flatMap((day) =>
      shoppingWeekMeals[day].ingredients.map((ingredient) => ({
        name: ingredient,
        category: "Meal ingredients",
      }))
    );

    const allNewItems = [
      ...dueStaples,
      ...mealIngredients,
    ];

    const existingNames = [
      ...shoppingItems.map((item) =>
        normaliseItemName(item.name)
      ),
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
        id: Date.now().toString() + item.name,
        name: item.name,
        category: item.category,
        checked: false,
      }));

    setShoppingItemsByWeek({
      ...shoppingItemsByWeek,
      [shoppingWeekKey]: [
        ...shoppingItems,
        ...newItems,
      ],
    });

    setActiveTab("shop");
  }

  function addInventoryItem() {
    const cleanedItem = newInventoryItem.trim();

    if (cleanedItem === "") return;

    setInventory([
      ...inventory,
      {
        id: Date.now().toString(),
        name: cleanedItem,
        category: "Other",
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
        (name) =>
          !existingNames.includes(normaliseItemName(name))
      )
      .map((name) => ({
        id: Date.now().toString() + name,
        name,
        category: "Other",
        quantity: null,
        unit: "",
        active: false,
      }));

    setInventory([...inventory, ...starterItems]);
  }

  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">Family meals</p>

          <h1>
            {activeTab === "home"
              ? "Home"
              : activeTab === "shop"
              ? "Shop for the week"
              : activeTab === "more"
                ? "More"
                : "Plan next week"}
          </h1>
        </div>
      </header>

      {activeTab === "home" && (
        <section className="screen home-screen">
          <div className="screen-header">
            <div>
              <p className="section-kicker">Dashboard</p>
              <h2>Next shop at a glance</h2>
            </div>
          </div>

          <div className="week-summary-grid">
            <article className="week-summary-card">
              <span>Planning week</span>
              <strong>
                {formatDate(mealWeekStart)} to {formatDate(mealWeekEnd)}
              </strong>
            </article>

            <article className="week-summary-card">
              <span>Shopping week</span>
              <strong>
                {formatDate(shoppingWeekStart)} to {formatDate(shoppingWeekEnd)}
              </strong>
            </article>
          </div>

          <div className="summary-grid">
            <article className="summary-card">
              <span>Meals planned</span>
              <strong>{mealsPlannedCount}</strong>
            </article>

            <article className="summary-card">
              <span>Active staples</span>
              <strong>{activeStaplesCount}</strong>
            </article>

            <article className="summary-card">
              <span>Inventory items</span>
              <strong>{inventoryItemsCount}</strong>
            </article>

            <article className="summary-card">
              <span>Shopping items</span>
              <strong>{shoppingItemsCount}</strong>
            </article>
          </div>

          <button className="primary-button home-primary" onClick={buildShoppingList}>
            Generate shopping list
          </button>

          <div className="home-actions">
            <button className="secondary" onClick={() => setActiveTab("plan")}>
              Plan meals
            </button>

            <button
              className="secondary"
              onClick={() => {
                setMoreSection("overview");
                setActiveTab("more");
              }}
            >
              Check inventory
            </button>

            <button
              className="secondary"
              onClick={() => {
                setMoreSection("staples");
                setActiveTab("more");
              }}
            >
              Manage staples
            </button>
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
            {days.map((day) => (
              <MealCard
                key={day}
                day={day}
                meal={meals[day]}
                updateMeal={updateMeal}
                isExpanded={expandedMealDay === day}
                toggleExpanded={() => toggleExpandedMealDay(day)}
              />
            ))}
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
                  : moreSection === "inventory"
                  ? "Inventory"
                  : moreSection === "settings"
                    ? "Settings"
                    : "Staples"}
              </h2>
            </div>
          </div>

          {moreSection === "overview" ? (
            <div className="more-summary-grid">
              <article className="more-summary-card">
                <div>
                  <p className="section-kicker">Staples</p>
                  <h3>Regular buys</h3>
                </div>

                <p className="small-text">
                  {activeStaplesCount} active of {staples.length} staples
                </p>

                <button type="button" onClick={() => setMoreSection("staples")}>
                  Manage Staples
                </button>
              </article>

              <article className="more-summary-card">
                <div>
                  <p className="section-kicker">Inventory</p>
                  <h3>Already at home</h3>
                </div>

                <p className="small-text">
                  {activeInventoryCount} active of {inventoryItemsCount} items
                </p>

                <button type="button" onClick={() => setMoreSection("inventory")}>
                  Manage Inventory
                </button>
              </article>

              <article className="more-summary-card">
                <div>
                  <p className="section-kicker">Settings</p>
                  <h3>Preferences</h3>
                </div>

                <p className="small-text">Settings will live here later.</p>

                <button
                  type="button"
                  className="secondary"
                  onClick={() => setMoreSection("settings")}
                >
                  View Settings
                </button>
              </article>
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

              {moreSection === "staples" && (
                <StaplesList
                  staples={staples}
                  newStaple={newStaple}
                  setNewStaple={setNewStaple}
                  addStaple={addStaple}
                  deleteStaple={deleteStaple}
                  updateStapleFrequency={updateStapleFrequency}
                  updateStapleCategory={updateStapleCategory}
                  toggleStapleActive={toggleStapleActive}
                />
              )}

              {moreSection === "inventory" && (
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
