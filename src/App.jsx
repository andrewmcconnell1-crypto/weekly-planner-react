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

function App() {
  const [activeTab, setActiveTab] = useState("meals");

  const [mealWeekStart, setMealWeekStart] = useState(getSunday);
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

    const existingNames = shoppingItems.map((item) =>
      normaliseItemName(item.name)
    );

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

    setActiveTab("shopping");
  }

  return (
    <main className="app">
      <header className="header">
        <div className="app-title-row">
          <div>
            <p className="eyebrow">Meal Planner</p>

            <h1>
              {activeTab === "shopping"
                ? "Next shop"
                : activeTab === "staples"
                  ? "Staples"
                  : "This week"}
            </h1>
          </div>
        </div>

        {activeTab === "shopping" ? (
          <>
            <div className="date-card">
              <span>{formatDate(shoppingWeekStart)}</span>
              <span>→</span>
              <span>{formatDate(shoppingWeekEnd)}</span>
            </div>

            <div className="week-nav">
              <button className="secondary" onClick={goToPreviousShoppingWeek}>
                Previous
              </button>

              <button onClick={goToNextShoppingWeekDefault}>Next shop</button>

              <button className="secondary" onClick={goToNextShoppingWeek}>
                Next
              </button>
            </div>
          </>
        ) : activeTab === "meals" ? (
          <>
            <div className="date-card">
              <span>{formatDate(mealWeekStart)}</span>
              <span>→</span>
              <span>{formatDate(mealWeekEnd)}</span>
            </div>

            <div className="week-nav">
              <button className="secondary" onClick={goToPreviousMealWeek}>
                Previous
              </button>

              <button onClick={goToThisMealWeek}>Today</button>

              <button className="secondary" onClick={goToNextMealWeek}>
                Next
              </button>
            </div>
          </>
        ) : (
          <p className="small-text">
            Manage recurring household items used to build future shopping
            lists.
          </p>
        )}
      </header>

      <nav className="tabs">
        <button
          className={activeTab === "meals" ? "tab active" : "tab"}
          onClick={() => setActiveTab("meals")}
        >
          Meals
        </button>

        <button
          className={activeTab === "shopping" ? "tab active" : "tab"}
          onClick={() => setActiveTab("shopping")}
        >
          Shopping
        </button>

        <button
          className={activeTab === "staples" ? "tab active" : "tab"}
          onClick={() => setActiveTab("staples")}
        >
          Staples
        </button>
      </nav>

      {activeTab === "meals" && (
        <section className="section">
          <h2>Meals</h2>

          {days.map((day) => (
            <MealCard
              key={day}
              day={day}
              meal={meals[day]}
              updateMeal={updateMeal}
            />
          ))}
        </section>
      )}

      {activeTab === "shopping" && (
        <ShoppingList
          newItem={newItem}
          setNewItem={setNewItem}
          addShoppingItem={addShoppingItem}
          shoppingItems={shoppingItems}
          toggleShoppingItem={toggleShoppingItem}
          deleteShoppingItem={deleteShoppingItem}
          buildShoppingList={buildShoppingList}
        />
      )}

      {activeTab === "staples" && (
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
    </main>
  );
}

export default App;