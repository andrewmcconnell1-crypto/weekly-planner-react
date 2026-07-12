import { days } from "./mealUtils";

// How many times each recipe has actually been cooked, read straight from the
// meal history — for a planner, the plan is the cooking record. Counts "cook"
// nights (leftovers/repeats and takeaways don't count) that have already
// happened: every night of past weeks, plus this week's nights before today.
// Future-planned nights don't count yet. Week keys are ISO dates, so a string
// compare orders them chronologically. Returns { [recipeId]: count }.
export function countRecipeCooks(mealsByWeek = {}, currentWeekKey, todayIndex) {
  const counts = {};

  const bump = (meal) => {
    if (meal && meal.mealType === "cook" && meal.recipeId) {
      counts[meal.recipeId] = (counts[meal.recipeId] || 0) + 1;
    }
  };

  for (const [weekKey, week] of Object.entries(mealsByWeek)) {
    if (!week) continue;

    if (weekKey < currentWeekKey) {
      for (const day of days) bump(week[day]);
    } else if (weekKey === currentWeekKey) {
      for (let i = 0; i < todayIndex; i += 1) bump(week[days[i]]);
    }
    // Future weeks: not cooked yet.
  }

  return counts;
}
