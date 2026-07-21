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
