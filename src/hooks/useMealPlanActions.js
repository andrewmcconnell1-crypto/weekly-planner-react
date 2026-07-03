import { createEmptyMeal, days } from "../utils/mealUtils";

// Meal-plan mutators for the active week. Each operates on `meals` (the active
// week's plan) and writes back into `mealsByWeek` under `mealWeekKey`.
export function useMealPlanActions({
  meals,
  mealsByWeek,
  setMealsByWeek,
  mealWeekKey,
  requestUndo,
}) {
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
    const snapshot = meals;
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

    requestUndo(`Removed ${day}'s plan`, () =>
      setMealsByWeek((prev) => ({ ...prev, [mealWeekKey]: snapshot }))
    );
  }

  // Drop a recipe onto a day as a cooked meal (used by the discovery deck),
  // optionally cooking once for `nights` and filling the following days with
  // leftovers. Done in a single update so the assignment and the leftovers
  // compose, rather than two setState calls clobbering each other.
  function assignRecipeToDay(day, recipe, nights = 1) {
    const startIndex = days.indexOf(day);

    setMealsByWeek((prevByWeek) => {
      const current = prevByWeek[mealWeekKey] || {};
      const nextMeals = {
        ...current,
        [day]: {
          ...createEmptyMeal(),
          mealType: "cook",
          name: recipe.name,
          recipeId: recipe.id,
        },
      };

      if (startIndex !== -1) {
        for (let index = startIndex + 1; index < days.length; index += 1) {
          const followingDay = days[index];
          const existingMeal = nextMeals[followingDay];
          const repeatsStartDay =
            existingMeal?.mealType === "repeat" &&
            existingMeal.repeatFromDay === day;

          if (index - startIndex < nights) {
            nextMeals[followingDay] = {
              name: "",
              recipeId: "",
              mealType: "repeat",
              repeatFromDay: day,
              ingredients: [],
            };
          } else if (repeatsStartDay) {
            nextMeals[followingDay] = createEmptyMeal();
          } else {
            break;
          }
        }
      }

      return { ...prevByWeek, [mealWeekKey]: nextMeals };
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

  // Swap the meals on two days (drag-to-rearrange). The whole meal objects
  // trade places, and any leftover pointers are remapped so a repeat that ate
  // dayA's cook now points to dayB (where that cook moved) and vice versa —
  // keeping "Leftovers from X" linkage correct after the move.
  function swapMealDays(dayA, dayB) {
    if (dayA === dayB || !days.includes(dayA) || !days.includes(dayB)) return;

    const snapshot = meals;
    const remap = (day) => (day === dayA ? dayB : day === dayB ? dayA : day);

    const nextMeals = { ...meals, [dayA]: meals[dayB], [dayB]: meals[dayA] };

    for (const day of days) {
      const meal = nextMeals[day];
      if (meal?.mealType === "repeat" && meal.repeatFromDay) {
        const remapped = remap(meal.repeatFromDay);
        if (remapped !== meal.repeatFromDay) {
          nextMeals[day] = { ...meal, repeatFromDay: remapped };
        }
      }
    }

    setMealsByWeek({ ...mealsByWeek, [mealWeekKey]: nextMeals });

    requestUndo(`Swapped ${dayA} and ${dayB}`, () =>
      setMealsByWeek((prev) => ({ ...prev, [mealWeekKey]: snapshot }))
    );
  }

  return {
    setLeftoverNights,
    clearMealDay,
    assignRecipeToDay,
    updateMeal,
    swapMealDays,
  };
}
