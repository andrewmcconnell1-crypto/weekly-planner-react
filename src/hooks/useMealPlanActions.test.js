// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";

import { useMealPlanActions } from "./useMealPlanActions";

function setup(meals) {
  const mealWeekKey = "2026-07-05";
  const mealsByWeek = { [mealWeekKey]: meals };
  const setMealsByWeek = vi.fn();
  const requestUndo = vi.fn();
  const { result } = renderHook(() =>
    useMealPlanActions({
      meals,
      mealsByWeek,
      setMealsByWeek,
      mealWeekKey,
      requestUndo,
    })
  );
  return { result, setMealsByWeek, requestUndo, mealWeekKey };
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

describe("useMealPlanActions — swapMealDays", () => {
  it("swaps two days' meals", () => {
    const meals = { Tuesday: cook("Tacos"), Thursday: cook("Curry") };
    const { result, setMealsByWeek, mealWeekKey } = setup(meals);

    result.current.swapMealDays("Tuesday", "Thursday");

    const next = setMealsByWeek.mock.calls[0][0][mealWeekKey];
    expect(next.Tuesday.name).toBe("Curry");
    expect(next.Thursday.name).toBe("Tacos");
  });

  it("moves a cook and its leftovers together as a group", () => {
    // Sunday cooks; Monday eats Sunday's leftovers. Drag the group to Wednesday:
    // the cook AND its leftover relocate to Wed+Thu (staying contiguous), and
    // whatever was there swaps back into Sun+Mon.
    const meals = {
      Sunday: cook("Roast"),
      Monday: repeat("Sunday"),
      Wednesday: cook("Pasta"),
    };
    const { result, setMealsByWeek, mealWeekKey } = setup(meals);

    result.current.swapMealDays("Sunday", "Wednesday");

    const next = setMealsByWeek.mock.calls[0][0][mealWeekKey];
    expect(next.Wednesday.name).toBe("Roast");
    expect(next.Thursday.mealType).toBe("repeat");
    expect(next.Thursday.repeatFromDay).toBe("Wednesday");
    expect(next.Sunday.name).toBe("Pasta");
    // Monday no longer holds a dangling leftover.
    expect(next.Monday.name).toBe("");
    expect(next.Monday.mealType).not.toBe("repeat");
  });

  it("moves the whole group when a leftover day is grabbed", () => {
    const meals = {
      Sunday: cook("Roast"),
      Monday: repeat("Sunday"),
      Thursday: cook("Pasta"),
    };
    const { result, setMealsByWeek, mealWeekKey } = setup(meals);

    // Grab Monday (the leftover) and drop on Thursday — the group still moves.
    result.current.swapMealDays("Monday", "Thursday");

    const next = setMealsByWeek.mock.calls[0][0][mealWeekKey];
    expect(next.Thursday.name).toBe("Roast");
    expect(next.Friday.repeatFromDay).toBe("Thursday");
    expect(next.Sunday.name).toBe("Pasta");
  });

  it("ignores a swap of a day with itself", () => {
    const meals = { Tuesday: cook("Tacos") };
    const { result, setMealsByWeek } = setup(meals);

    result.current.swapMealDays("Tuesday", "Tuesday");
    expect(setMealsByWeek).not.toHaveBeenCalled();
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
