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

  it("remaps leftover pointers so linkage survives the swap", () => {
    // Sunday cooks; Monday eats Sunday's leftovers. Swap Sunday <-> Wednesday:
    // the cook moves to Wednesday, so Monday's leftovers must now point there.
    const meals = {
      Sunday: cook("Roast"),
      Monday: repeat("Sunday"),
      Wednesday: cook("Pasta"),
    };
    const { result, setMealsByWeek, mealWeekKey } = setup(meals);

    result.current.swapMealDays("Sunday", "Wednesday");

    const next = setMealsByWeek.mock.calls[0][0][mealWeekKey];
    expect(next.Wednesday.name).toBe("Roast");
    expect(next.Sunday.name).toBe("Pasta");
    expect(next.Monday.repeatFromDay).toBe("Wednesday");
  });

  it("ignores a swap of a day with itself", () => {
    const meals = { Tuesday: cook("Tacos") };
    const { result, setMealsByWeek } = setup(meals);

    result.current.swapMealDays("Tuesday", "Tuesday");
    expect(setMealsByWeek).not.toHaveBeenCalled();
  });
});
