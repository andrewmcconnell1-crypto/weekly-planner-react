// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";

import { useMealPlanActions } from "./useMealPlanActions";

function setup(meals, extra = {}) {
  const mealWeekKey = "2026-07-05";
  const mealsByWeek = { [mealWeekKey]: meals, ...(extra.mealsByWeek || {}) };
  const setMealsByWeek = vi.fn();
  const requestUndo = vi.fn();
  const setShoppingChecked = vi.fn();
  // Resolve a meal's ingredients the way the app does (recipe link or the
  // meal's own list), enough for the tick-clearing tests.
  const getIngredientsForMeal = (meal) =>
    (meal?.mealType || "cook") === "cook"
      ? [...(extra.recipeIngredients?.[meal?.recipeId] || []), ...(meal?.ingredients || [])]
      : [];
  const { result } = renderHook(() =>
    useMealPlanActions({
      meals,
      mealsByWeek,
      setMealsByWeek,
      mealWeekKey,
      requestUndo,
      setShoppingChecked,
      getIngredientsForMeal,
    })
  );
  return { result, setMealsByWeek, setShoppingChecked, requestUndo, mealWeekKey };
}

const cook = (name) => ({
  name,
  recipeId: "",
  mealType: "cook",
  repeatFromDay: "",
  ingredients: [],
});
const repeat = (from) => ({
  name: "",
  recipeId: "",
  mealType: "repeat",
  repeatFromDay: from,
  ingredients: [],
});
const takeaway = (name) => ({
  name,
  recipeId: "",
  mealType: "takeaway",
  repeatFromDay: "",
  ingredients: [],
});

describe("useMealPlanActions — swapMealDays", () => {
  it("swaps two single meals, leaving the day between untouched", () => {
    const meals = { Tuesday: cook("Tacos"), Thursday: cook("Curry") };
    const { result, setMealsByWeek, mealWeekKey } = setup(meals);

    result.current.swapMealDays("Tuesday", "Thursday");

    const next = setMealsByWeek.mock.calls[0][0][mealWeekKey];
    expect(next.Tuesday.name).toBe("Curry");
    expect(next.Thursday.name).toBe("Tacos");
    expect(next.Wednesday?.name || "").toBe("");
  });

  it("shifts a leftover group as a whole when swapping with a single day", () => {
    // The reported case: Mon cook, Tue its leftovers, Wed takeaway. Swap Wed
    // with Mon → takeaway on Mon, the cook shifts to Tue, its leftovers to Wed.
    const meals = {
      Monday: cook("Roast"),
      Tuesday: repeat("Monday"),
      Wednesday: takeaway("Thai"),
    };
    const { result, setMealsByWeek, mealWeekKey } = setup(meals);

    result.current.swapMealDays("Wednesday", "Monday");

    const next = setMealsByWeek.mock.calls[0][0][mealWeekKey];
    expect(next.Monday.name).toBe("Thai");
    expect(next.Monday.mealType).toBe("takeaway");
    expect(next.Tuesday.name).toBe("Roast");
    expect(next.Tuesday.mealType).toBe("cook");
    expect(next.Wednesday.mealType).toBe("repeat");
    expect(next.Wednesday.repeatFromDay).toBe("Tuesday");
  });

  it("gives the same result whichever of the two blocks is grabbed", () => {
    const meals = {
      Monday: cook("Roast"),
      Tuesday: repeat("Monday"),
      Wednesday: takeaway("Thai"),
    };
    const { result, setMealsByWeek, mealWeekKey } = setup(meals);

    result.current.swapMealDays("Monday", "Wednesday"); // grab the group instead

    const next = setMealsByWeek.mock.calls[0][0][mealWeekKey];
    expect(next.Monday.name).toBe("Thai");
    expect(next.Tuesday.name).toBe("Roast");
    expect(next.Wednesday.repeatFromDay).toBe("Tuesday");
  });

  it("moves the whole group when a leftover day is grabbed", () => {
    const meals = {
      Sunday: cook("Roast"),
      Monday: repeat("Sunday"),
      Thursday: cook("Pasta"),
    };
    const { result, setMealsByWeek, mealWeekKey } = setup(meals);

    // Grab Monday (the leftover) and drop on Thursday. The group swaps with the
    // Thursday cook across the Sun–Thu span: Pasta lands first (Sunday), the
    // group ends where Thursday was (Wed cook, Thu leftovers).
    result.current.swapMealDays("Monday", "Thursday");

    const next = setMealsByWeek.mock.calls[0][0][mealWeekKey];
    expect(next.Sunday.name).toBe("Pasta");
    expect(next.Wednesday.name).toBe("Roast");
    expect(next.Thursday.mealType).toBe("repeat");
    expect(next.Thursday.repeatFromDay).toBe("Wednesday");
  });

  it("pushes leftovers along when a cook is dropped onto its own leftover", () => {
    // The reported bug: Mon cook, Tue its leftovers, Wed another cook. Dragging
    // Monday forward onto its own Tuesday leftover should push the leftovers to
    // Wednesday and bring Wednesday's meal back to Monday — not do nothing.
    const meals = {
      Monday: cook("Roast"),
      Tuesday: repeat("Monday"),
      Wednesday: cook("Curry"),
    };
    const { result, setMealsByWeek, mealWeekKey } = setup(meals);

    result.current.swapMealDays("Monday", "Tuesday");

    const next = setMealsByWeek.mock.calls[0][0][mealWeekKey];
    expect(next.Monday.name).toBe("Curry");
    expect(next.Tuesday.name).toBe("Roast");
    expect(next.Tuesday.mealType).toBe("cook");
    expect(next.Wednesday.mealType).toBe("repeat");
    expect(next.Wednesday.repeatFromDay).toBe("Tuesday");
  });

  it("does nothing when a block dropped on its own leftover has no neighbour", () => {
    // Cook + leftovers with nothing after them: there's no block to push into,
    // so the drag is a no-op rather than corrupting the plan.
    const meals = {
      Friday: cook("Roast"),
      Saturday: repeat("Friday"),
    };
    const { result, setMealsByWeek } = setup(meals);

    result.current.swapMealDays("Friday", "Saturday");
    expect(setMealsByWeek).not.toHaveBeenCalled();
  });

  it("ignores a swap of a day with itself", () => {
    const meals = { Tuesday: cook("Tacos") };
    const { result, setMealsByWeek } = setup(meals);

    result.current.swapMealDays("Tuesday", "Tuesday");
    expect(setMealsByWeek).not.toHaveBeenCalled();
  });
});

describe("useMealPlanActions — clears stale shopping ticks", () => {
  // A tick left over from a past shop (checked map is keyed by item name and
  // persists) must not silently mark a newly-planned meal's ingredient as Done.
  function checkedUpdates(setShoppingChecked) {
    // Apply each functional update to a seeded map to see what was cleared.
    return (seed) =>
      setShoppingChecked.mock.calls.reduce(
        (state, [updater]) =>
          typeof updater === "function" ? updater(state) : updater,
        seed
      );
  }

  it("clears ticks for a recipe assigned to a day (assignRecipeToDay)", () => {
    const { result, setShoppingChecked } = setup(
      { Monday: cook("") },
      { recipeIngredients: { r1: ["Chicken thighs", "Rice"] } }
    );

    result.current.assignRecipeToDay("Monday", {
      id: "r1",
      name: "Katsu",
      ingredients: ["Chicken thighs", "Rice"],
    });

    const next = checkedUpdates(setShoppingChecked)({
      "chicken thigh": true,
      rice: true,
      milk: true,
    });
    expect(next["chicken thigh"]).toBeUndefined();
    expect(next.rice).toBeUndefined();
    expect(next.milk).toBe(true); // untouched — not part of the new meal
  });

  it("clears ticks for a recipe planned on a specific week/day (assignRecipeToWeekDay)", () => {
    const { result, setShoppingChecked } = setup(
      {},
      { recipeIngredients: { r1: ["Basil"] } }
    );

    result.current.assignRecipeToWeekDay("2026-07-12", "Thursday", {
      id: "r1",
      name: "Pesto pasta",
      ingredients: ["Basil"],
    });

    const next = checkedUpdates(setShoppingChecked)({ basil: true });
    expect(next.basil).toBeUndefined();
  });

  it("does not re-clear ticks for ingredients already on that day", () => {
    // Editing a meal that keeps the same ingredients (e.g. bumping servings)
    // must not yank already-bought items back out of Done.
    const { result, setShoppingChecked } = setup({
      Monday: { ...cook("Soup"), ingredients: ["Carrot"] },
    });

    result.current.updateMeal("Monday", {
      ...cook("Soup"),
      ingredients: ["Carrot"],
      batches: 2,
    });

    const next = checkedUpdates(setShoppingChecked)({ carrot: true });
    expect(next.carrot).toBe(true); // still bought — nothing newly introduced
  });
});

describe("useMealPlanActions — assignRecipeToWeekDay", () => {
  it("assigns a recipe to a specific week + day", () => {
    const { result, setMealsByWeek } = setup({});
    result.current.assignRecipeToWeekDay("2026-07-12", "Wednesday", {
      id: "r1",
      name: "Fried Rice",
    });
    const updater = setMealsByWeek.mock.calls[0][0];
    const next = updater({ "2026-07-12": {} });
    expect(next["2026-07-12"].Wednesday).toMatchObject({
      recipeId: "r1",
      name: "Fried Rice",
      mealType: "cook",
    });
  });

  it("ignores an unknown day", () => {
    const { result, setMealsByWeek } = setup({});
    result.current.assignRecipeToWeekDay("2026-07-12", "Someday", {
      id: "r1",
      name: "X",
    });
    expect(setMealsByWeek).not.toHaveBeenCalled();
  });
});
