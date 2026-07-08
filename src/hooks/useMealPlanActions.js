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

  // The block a day belongs to, as [startIndex, endIndex]: a cooked meal plus
  // its trailing leftovers, or a single day for anything else. Grabbing any
  // leftover day resolves to the whole group.
  function blockBounds(dayMeals, day) {
    const cookDay = groupCookDay(dayMeals, day);
    const start = days.indexOf(cookDay);
    const length = isCookedMeal(dayMeals[cookDay])
      ? groupLength(dayMeals, cookDay)
      : 1;
    return { start, end: start + length - 1 };
  }

  // Drag-to-rearrange. Meals move as blocks — a cooked meal and its leftover
  // days are one unit. Swapping two blocks lays them out contiguously across
  // their combined span (later block first, then any days between, then the
  // earlier block), so e.g. dropping a takeaway on a Mon cook with Tue
  // leftovers gives Mon takeaway, Tue cook, Wed leftovers — the group shifts as
  // a whole and nothing is orphaned. Leftover pointers are remapped to follow
  // their cook. `sourceDay`/`targetDay` are the grabbed and dropped days.
  function swapMealDays(sourceDay, targetDay) {
    if (
      sourceDay === targetDay ||
      !days.includes(sourceDay) ||
      !days.includes(targetDay)
    ) {
      return;
    }

    let a = blockBounds(meals, sourceDay);
    let b = blockBounds(meals, targetDay);
    if (a.start === b.start) return; // same block — nothing to do
    if (a.start > b.start) [a, b] = [b, a]; // a is the earlier block

    const snapshot = meals;
    const mealAt = (index) => meals[days[index]] || createEmptyMeal();
    const slice = (from, to) => {
      const out = [];
      for (let i = from; i <= to; i += 1) out.push({ old: days[i], meal: mealAt(i) });
      return out;
    };

    // Combined span [a.start .. b.end] is re-laid contiguously: block B, then
    // the untouched days between, then block A.
    const reordered = [
      ...slice(b.start, b.end),
      ...slice(a.end + 1, b.start - 1),
      ...slice(a.start, a.end),
    ];

    // Old day -> new day for everything in the span (identity outside it), so
    // leftover pointers can follow their cook to its new day.
    const dayMap = Object.fromEntries(days.map((day) => [day, day]));
    reordered.forEach((entry, offset) => {
      dayMap[entry.old] = days[a.start + offset];
    });

    const nextMeals = { ...meals };
    reordered.forEach((entry, offset) => {
      const newDay = days[a.start + offset];
      const meal = entry.meal;
      nextMeals[newDay] =
        meal?.mealType === "repeat" && meal.repeatFromDay
          ? { ...meal, repeatFromDay: dayMap[meal.repeatFromDay] ?? meal.repeatFromDay }
          : meal;
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
