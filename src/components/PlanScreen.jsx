import { lazy, Suspense } from "react";

import WeekControls from "./WeekControls";
import MealGroups from "./MealGroups";
import ErrorBoundary from "./ErrorBoundary";
import SheetError from "./SheetError";
import { formatDate } from "../utils/dateUtils";
import { days } from "../utils/mealUtils";

const MealEditorSheet = lazy(() => import("./MealEditorSheet"));

export default function PlanScreen({
  mealWeekStart,
  mealWeekEnd,
  mealsPlannedCount,
  planGapsLabel,
  firstUnplannedDay,
  setExpandedMealDay,
  setDiscoverDay,
  setDiscoverOpen,
  mealWeekMode,
  goToThisMealWeek,
  goToNextMealWeekDefault,
  goToPreviousMealWeek,
  goToNextMealWeek,
  meals,
  getMealSummary,
  recipes,
  expandedMealDay,
  expandedDayLabel,
  expandedMeal,
  expandedDaySummary,
  planningDaySummaries,
  expandedLeftoverNights,
  expandedMaxNights,
  setLeftoverNights,
  clearMealDay,
  updateMeal,
}) {
  return (
    <section className="screen plan-screen">
      <div className="page-hero plan-hero">
        <p className="page-hero-kicker">
          Meal plan · {formatDate(mealWeekStart)} – {formatDate(mealWeekEnd)}
        </p>

        <strong className="page-hero-count">
          {mealsPlannedCount} of {days.length} dinners planned
        </strong>

        <p className="page-hero-sub">{planGapsLabel}</p>

        <div className="page-hero-actions">
          {firstUnplannedDay && (
            <button
              type="button"
              className="page-hero-action"
              onClick={() => setExpandedMealDay(firstUnplannedDay)}
            >
              Plan {firstUnplannedDay}
            </button>
          )}

          <button
            type="button"
            className="page-hero-action page-hero-action-ghost"
            onClick={() => {
              setDiscoverDay(null);
              setDiscoverOpen(true);
            }}
          >
            Find meals by swiping
          </button>
        </div>
      </div>

      <WeekControls
        activePreset={mealWeekMode}
        onThisWeek={goToThisMealWeek}
        onNextWeekPreset={goToNextMealWeekDefault}
        onPreviousWeek={goToPreviousMealWeek}
        onNextWeek={goToNextMealWeek}
      />

      <div className="meal-grid">
        <MealGroups
          dayList={days}
          meals={meals}
          getMealSummary={getMealSummary}
          onOpenDay={setExpandedMealDay}
        />
      </div>

      {expandedMealDay && (
        <ErrorBoundary
          fallback={<SheetError onClose={() => setExpandedMealDay(null)} />}
        >
          <Suspense fallback={null}>
            <MealEditorSheet
            key={expandedMealDay}
            day={expandedMealDay}
            dateLabel={expandedDayLabel}
            meal={expandedMeal}
            days={days}
            recipes={recipes}
            linkedRecipe={expandedDaySummary?.linkedRecipe}
            weekDaySummaries={planningDaySummaries}
            leftoverNights={expandedLeftoverNights}
            maxNights={expandedMaxNights}
            onSetNights={(nights) => setLeftoverNights(expandedMealDay, nights)}
            onClearDay={() => clearMealDay(expandedMealDay)}
            updateMeal={updateMeal}
            onClose={() => setExpandedMealDay(null)}
            onFindMeals={() => {
              const day = expandedMealDay;
              setExpandedMealDay(null);
              setDiscoverDay(day);
              setDiscoverOpen(true);
            }}
            />
          </Suspense>
        </ErrorBoundary>
      )}
    </section>
  );
}
