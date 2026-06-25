import { describe, it, expect } from "vitest";

import { buildPlannerView } from "./plannerView";
import { days, createEmptyMeals } from "./mealUtils";

// A stub meal-summary helper so these tests exercise buildPlannerView's own
// derivation, not createMealHelpers. `planned` lists the days that have a meal.
function makeGetSummary(planned = []) {
  return (day) => ({
    day,
    hasMeal: planned.includes(day),
    label: "",
    tone: "",
    name: "",
    linkedRecipe: planned.includes(day) ? { id: `r-${day}` } : null,
  });
}

function baseArgs(overrides = {}) {
  return {
    mealWeekStart: new Date("2026-06-21"), // a Sunday
    mealWeekKey: "wk-this",
    currentWeekKey: "wk-this",
    nextWeekKey: "wk-next",
    shoppingWeekKey: "wk-this",
    mealsByWeek: {},
    meals: createEmptyMeals(),
    getMealSummary: makeGetSummary(),
    today: new Date("2026-06-24"), // a Wednesday
    todayDayName: "Wednesday",
    expandedMealDay: null,
    staples: [],
    inventory: [],
    unifiedItems: [],
    recurringRemovals: [],
    removalIds: new Set(),
    removalAcksByWeek: {},
    shoppingChecked: {},
    guest: false,
    user: null,
    welcomeDismissedFor: null,
    welcomePreview: false,
    ...overrides,
  };
}

describe("buildPlannerView", () => {
  it("flags the home/meal week mode from the active week keys", () => {
    expect(buildPlannerView(baseArgs()).homeWeekMode).toBe("current");
    expect(buildPlannerView(baseArgs()).mealWeekMode).toBe("current");

    const nextWeek = buildPlannerView(
      baseArgs({ mealWeekKey: "wk-next", shoppingWeekKey: "wk-next" })
    );
    expect(nextWeek.homeWeekMode).toBe("next");

    const custom = buildPlannerView(baseArgs({ mealWeekKey: "wk-other" }));
    expect(custom.homeWeekMode).toBe("custom");
  });

  it("summarises planning gaps across the week", () => {
    const empty = buildPlannerView(baseArgs());
    expect(empty.mealsPlannedCount).toBe(0);
    expect(empty.planGapsLabel).toBe("7 nights still need a meal.");

    const full = buildPlannerView(
      baseArgs({ getMealSummary: makeGetSummary(days) })
    );
    expect(full.mealsPlannedCount).toBe(7);
    expect(full.firstUnplannedDay).toBe(null);
    expect(full.planGapsLabel).toBe("Every night is planned.");
    expect(full.plannedRecipeIds).toHaveLength(7);

    const twoGaps = buildPlannerView(
      baseArgs({
        getMealSummary: makeGetSummary(
          days.filter((d) => d !== "Monday" && d !== "Friday")
        ),
      })
    );
    expect(twoGaps.firstUnplannedDay).toBe("Monday");
    expect(twoGaps.planGapsLabel).toBe("Monday and Friday still need a meal.");
  });

  it("lists the days coming up after today and keeps Other last in categories", () => {
    const view = buildPlannerView(
      baseArgs({
        staples: [{ name: "Milk", category: "Zebra aisle", active: true }],
      })
    );
    // Wednesday is index 3, so Thursday–Saturday come up next.
    expect(view.comingUpDays).toEqual(["Thursday", "Friday", "Saturday"]);
    expect(view.availableCategories[view.availableCategories.length - 1]).toBe(
      "Other"
    );
    expect(view.availableCategories).toContain("Zebra aisle");
    expect(view.activeStaplesCount).toBe(1);
  });

  it("shows the welcome card until a workflow is complete, then hides it", () => {
    expect(buildPlannerView(baseArgs()).showWelcome).toBe(true);

    // A planned meal plus a ticked-off item counts as a completed workflow.
    const completed = buildPlannerView(
      baseArgs({
        mealsByWeek: { "wk-this": { Monday: { name: "Pasta" } } },
        shoppingChecked: { milk: true },
      })
    );
    expect(completed.showWelcome).toBe(false);
    expect(completed.welcomeSessionKey).toBe("local");
  });
});
