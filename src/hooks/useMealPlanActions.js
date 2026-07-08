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

  function isCookedMeal(meal) {
    return (
      (meal?.mealType || "cook") === "cook" &&
      ((meal?.name || "").trim() !== "" ||
        meal?.recipeId ||
        (Array.isArray(meal?.ingredients) && meal.ingredients.length > 0))
    );
  }

  // The cook day a given day belongs to: its own day if it's a cook (or empty),
  // or the day it takes leftovers from if it's a repeat.
  function groupCookDay(dayMeals, day) {
    const meal = dayMeals[day];
    if (meal?.mealType === "repeat" && meal.repeatFromDay) {
      return meal.repeatFromDay;
    }
    return day;
  }

  // How many consecutive days a cook occupies: itself plus the trailing days
  // that are leftovers of it.
  function groupLength(dayMeals, cookDay) {
    const start = days.indexOf(cookDay);
    let length = 1;
    for (let index = start + 1; index < days.length; index += 1) {
      const meal = dayMeals[days[index]];
      if (meal?.mealType === "repeat" && meal.repeatFromDay === cookDay) {
        length += 1;
      } else {
        break;
      }
    }
    return length;
  }

  // Clear any leftover day that isn't contiguously backed by its cook (its
  // source is a real cook, sits earlier in the week, and every day between is a
  // leftover of that same cook) — so a move can never leave a dangling or
  // backwards "Leftovers from X".
  function normaliseLeftovers(dayMeals) {
    days.forEach((day, index) => {
      const meal = dayMeals[day];
      if (meal?.mealType !== "repeat" || !meal.repeatFromDay) return;

      const fromIndex = days.indexOf(meal.repeatFromDay);
      let valid =
        fromIndex >= 0 &&
        fromIndex < index &&
        isCookedMeal(dayMeals[meal.repeatFromDay]);
      for (let between = fromIndex + 1; valid && between < index; between += 1) {
        const inner = dayMeals[days[between]];
        if (
          inner?.mealType !== "repeat" ||
          inner.repeatFromDay !== meal.repeatFromDay
        ) {
          valid = false;
        }
      }
      if (!valid) dayMeals[day] = createEmptyMeal();
    });
  }

  // Drag-to-rearrange. A cooked meal and its leftover days move together as one
  // block: grabbing any day of a group relocates the whole group, swapping it
  // with the equal-length window of days at the drop point and remapping
  // leftover pointers so linkage survives. `sourceDay`/`targetDay` are the
  // grabbed and dropped days.
  function swapMealDays(sourceDay, targetDay) {
    if (
      sourceDay === targetDay ||
      !days.includes(sourceDay) ||
      !days.includes(targetDay)
    ) {
      return;
    }

    const snapshot = meals;
    const cookDay = groupCookDay(meals, sourceDay);
    const srcStart = days.indexOf(cookDay);
    const length = groupLength(meals, cookDay);
    let tgtStart = days.indexOf(targetDay);

    // Dropped somewhere inside the group's own span — nothing to do.
    if (tgtStart >= srcStart && tgtStart < srcStart + length) return;

    // Keep the moved window inside the week, and flush it clear of the source
    // window if the drop point would make the two overlap.
    tgtStart = Math.max(0, Math.min(tgtStart, days.length - length));
    if (Math.abs(tgtStart - srcStart) < length) {
      tgtStart =
        tgtStart > srcStart
          ? Math.min(srcStart + length, days.length - length)
          : Math.max(srcStart - length, 0);
      if (tgtStart === srcStart) return;
    }

    // Swap the two equal-length day windows, tracking where each day moved so
    // leftover pointers can be remapped to follow their cook.
    const arr = days.map((day) => meals[day] || createEmptyMeal());
    const dayMap = Object.fromEntries(days.map((day) => [day, day]));
    for (let offset = 0; offset < length; offset += 1) {
      const a = srcStart + offset;
      const b = tgtStart + offset;
      [arr[a], arr[b]] = [arr[b], arr[a]];
      dayMap[days[a]] = days[b];
      dayMap[days[b]] = days[a];
    }

    const nextMeals = {};
    days.forEach((day, index) => {
      const meal = arr[index];
      if (meal?.mealType === "repeat" && meal.repeatFromDay) {
        nextMeals[day] = {
          ...meal,
          repeatFromDay: dayMap[meal.repeatFromDay] ?? meal.repeatFromDay,
        };
      } else {
        nextMeals[day] = meal;
      }
    });
    normaliseLeftovers(nextMeals);

    setMealsByWeek({ ...mealsByWeek, [mealWeekKey]: nextMeals });

    requestUndo("Moved meal", () =>
      setMealsByWeek((prev) => ({ ...prev, [mealWeekKey]: snapshot }))
    );
  }

  // Assign a recipe to a specific week + day (single night), for planning from
  // outside the active week — e.g. the baskets page, where you choose the slot.
  // Overwrites whatever's there; leftover-repeat spreading stays a Meals-tab job.
  function assignRecipeToWeekDay(weekKey, day, recipe) {
    if (!days.includes(day)) return;
    setMealsByWeek((prevByWeek) => {
      const current = prevByWeek[weekKey] || {};
      return {
        ...prevByWeek,
        [weekKey]: {
          ...current,
          [day]: {
            ...createEmptyMeal(),
            mealType: "cook",
            name: recipe.name,
            recipeId: recipe.id,
          },
        },
      };
    });
  }

  return {
    setLeftoverNights,
    clearMealDay,
    assignRecipeToDay,
    assignRecipeToWeekDay,
    updateMeal,
    swapMealDays,
  };
}
