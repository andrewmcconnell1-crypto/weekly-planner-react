import { days, createEmptyMeals } from "./mealUtils";
import { formatDate } from "./dateUtils";
import { categories } from "../data/categories";

// Assemble the derived "view model" the screens render from: week modes, the
// Tonight card, planning summaries, the open-day editor details, the shared
// category list, shopping counts, and the welcome-card visibility. Pure given
// its inputs — no React, no setters — so it can be reasoned about and tested
// apart from the component tree. (App computes the week keys + unified shopping
// list before its loading gates, since the action hooks need them, then hands
// them here for the rest of the derivation.)
export function buildPlannerView({
  mealWeekStart,
  mealWeekKey,
  currentWeekKey,
  nextWeekKey,
  shoppingWeekKey,
  mealsByWeek,
  meals,
  getMealSummary,
  today,
  todayDayName,
  expandedMealDay,
  staples,
  inventory,
  unifiedItems,
  recurringRemovals,
  removalIds,
  removalAcksByWeek,
  shoppingChecked,
  guest,
  user,
  welcomeDismissedFor,
  welcomePreview,
}) {
  const homeWeekMode =
    mealWeekKey === currentWeekKey && shoppingWeekKey === currentWeekKey
      ? "current"
      : mealWeekKey === nextWeekKey && shoppingWeekKey === nextWeekKey
        ? "next"
        : "custom";
  const mealWeekMode =
    mealWeekKey === currentWeekKey
      ? "current"
      : mealWeekKey === nextWeekKey
        ? "next"
        : "custom";

  // "Tonight" on Home: today's meal, drawn from the current week's plan.
  const currentWeekMeals = mealsByWeek[currentWeekKey] || createEmptyMeals();

  // How far along next week's plan is, for the Home nudge.
  const nextWeekMeals = mealsByWeek[nextWeekKey] || createEmptyMeals();
  const nextWeekPlannedCount = days.filter(
    (day) => getMealSummary(day, nextWeekMeals[day], nextWeekMeals).hasMeal
  ).length;
  const tonightSummary = getMealSummary(
    todayDayName,
    currentWeekMeals[todayDayName],
    currentWeekMeals
  );
  const todayIndex = days.indexOf(todayDayName);
  let tonightCovers = 1;
  if (
    tonightSummary.hasMeal &&
    (currentWeekMeals[todayDayName]?.mealType || "cook") === "cook"
  ) {
    for (let i = todayIndex + 1; i < days.length; i += 1) {
      const followingMeal = currentWeekMeals[days[i]];

      if (
        followingMeal?.mealType === "repeat" &&
        followingMeal.repeatFromDay === todayDayName
      ) {
        tonightCovers += 1;
      } else {
        break;
      }
    }
  }
  const tonightLeftoverDays = days.slice(todayIndex + 1, todayIndex + tonightCovers);
  const tonightLeftoverLabel =
    tonightLeftoverDays.length === 1
      ? tonightLeftoverDays[0]
      : `${tonightLeftoverDays[0]?.slice(0, 3)}–${tonightLeftoverDays[
          tonightLeftoverDays.length - 1
        ]?.slice(0, 3)}`;
  const tonightDateLabel = today.toLocaleDateString("en-AU", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const mealWeekEnd = new Date(mealWeekStart);
  mealWeekEnd.setDate(mealWeekStart.getDate() + 6);

  const planningDaySummaries = days.map((day) =>
    getMealSummary(day, meals[day], meals)
  );
  const mealsPlannedCount = planningDaySummaries.filter(
    (daySummary) => daySummary.hasMeal
  ).length;
  const unplannedDays = planningDaySummaries
    .filter((daySummary) => !daySummary.hasMeal)
    .map((daySummary) => daySummary.day);
  const firstUnplannedDay = unplannedDays[0] || null;
  // Recipes already on the week, so the discovery deck doesn't re-offer them.
  const plannedRecipeIds = planningDaySummaries
    .map((daySummary) => daySummary.linkedRecipe?.id)
    .filter(Boolean);
  const planGapsLabel =
    unplannedDays.length === 0
      ? "Every night is planned."
      : unplannedDays.length <= 2
        ? `${unplannedDays.join(" and ")} still need${
            unplannedDays.length === 1 ? "s" : ""
          } a meal.`
        : `${unplannedDays.length} nights still need a meal.`;

  // Details for the day whose editor sheet is open (if any).
  const expandedDayIndex = expandedMealDay ? days.indexOf(expandedMealDay) : -1;
  const expandedMeal = expandedMealDay ? meals[expandedMealDay] : null;
  const expandedDaySummary = expandedMealDay
    ? getMealSummary(expandedMealDay, expandedMeal, meals)
    : null;
  let expandedDayLabel = "";
  if (expandedDayIndex >= 0) {
    const expandedDate = new Date(mealWeekStart);
    expandedDate.setDate(mealWeekStart.getDate() + expandedDayIndex);
    expandedDayLabel = formatDate(expandedDate);
  }

  // "How many nights?" for the open day: 1 (cook night) + the consecutive run
  // of following days that repeat this day's meal as leftovers.
  let expandedLeftoverNights = 1;
  if (expandedDayIndex >= 0) {
    for (let index = expandedDayIndex + 1; index < days.length; index += 1) {
      const followingMeal = meals[days[index]];

      if (
        followingMeal?.mealType === "repeat" &&
        followingMeal.repeatFromDay === expandedMealDay
      ) {
        expandedLeftoverNights += 1;
      } else {
        break;
      }
    }
  }
  // A cooked meal can stretch to at most 3 nights of leftovers, never past the
  // end of the week.
  const expandedMaxNights =
    expandedDayIndex >= 0 ? Math.min(3, days.length - expandedDayIndex) : 1;

  const activeStaplesCount = staples.filter(
    (staple) => staple.active !== false
  ).length;

  const activeInventoryCount = inventory.filter(
    (item) => item.active !== false
  ).length;

  // Categories offered when adding/editing stock & recurring buys: the built-in
  // aisles plus any custom ones already on items (so user-created categories
  // stick around and are shared across both lists). "Other" stays last.
  const customCategories = [
    ...new Set(
      [...staples, ...inventory]
        .map((item) => item.category)
        .filter((category) => category && !categories.includes(category))
    ),
  ].sort((a, b) => a.localeCompare(b));
  const availableCategories = [
    ...categories.filter((category) => category !== "Other"),
    ...customCategories,
    "Other",
  ];

  const unifiedPending = unifiedItems.filter((item) => !item.checked).length;
  // Removals are about this week's standing order; their "handled" ticks are
  // kept per week, pruned to removals still present.
  const removalAckIds = (removalAcksByWeek[currentWeekKey] || []).filter((id) =>
    removalIds.has(id)
  );
  const pendingRemovalCount = recurringRemovals.filter(
    (item) => !removalAckIds.includes(item.id)
  ).length;

  // Whether the user has completed the full workflow (plan a meal -> tick
  // something off the list). Derived, so we never setState inside an effect.
  const welcomeWorkflowComplete =
    Object.values(mealsByWeek).some((weekMeals) =>
      days.some((d) => {
        const m = weekMeals?.[d];
        return (
          m && (m.name || m.recipeId || (m.mealType && m.mealType !== "cook"))
        );
      })
    ) && Object.values(shoppingChecked).some(Boolean);

  // Identifies the current session so the welcome's dismissed/done state is
  // per-account: a new sign-in, sign-out, or guest gets a different key and
  // therefore sees the card again (until their data shows a completed workflow).
  const welcomeSessionKey = guest ? "guest" : user?.id || "local";
  const showWelcome =
    welcomeDismissedFor !== welcomeSessionKey &&
    (welcomePreview || !welcomeWorkflowComplete);

  const comingUpDays = todayIndex >= 0 ? days.slice(todayIndex + 1) : [];

  return {
    homeWeekMode,
    mealWeekMode,
    tonightSummary,
    tonightCovers,
    tonightLeftoverLabel,
    tonightDateLabel,
    mealWeekEnd,
    planningDaySummaries,
    mealsPlannedCount,
    unplannedDays,
    firstUnplannedDay,
    plannedRecipeIds,
    planGapsLabel,
    expandedMeal,
    expandedDaySummary,
    expandedDayLabel,
    expandedLeftoverNights,
    expandedMaxNights,
    activeStaplesCount,
    activeInventoryCount,
    availableCategories,
    unifiedPending,
    removalAckIds,
    pendingRemovalCount,
    welcomeSessionKey,
    showWelcome,
    comingUpDays,
    currentWeekMeals,
    nextWeekPlannedCount,
  };
}
