import { ChevronRight, X } from "lucide-react";

import TonightCard from "./TonightCard";
import MealGroups from "./MealGroups";
import ProgressRing from "./ProgressRing";
import { formatDate } from "../utils/dateUtils";
import { days } from "../utils/mealUtils";

// Home is the glance-and-go dashboard: what's for dinner tonight, how the week
// is shaping up (with a one-tap way to fill the gaps), and whether there's
// shopping to do. No management trivia — stock lives in Kitchen.
export default function HomeScreen({
  todayDayName,
  tonightDateLabel,
  tonightSummary,
  tonightCovers,
  tonightLeftoverLabel,
  openTonightInPlan,
  currentWeekStart,
  showWelcome,
  dismissWelcome,
  setActiveTab,
  meals,
  getMealSummary,
  openHomeDayInPlan,
  homeShopStatus,
  nextWeekPlannedCount,
  openNextWeekPlan,
  setMoreSection,
}) {
  const gapDays = days.filter(
    (day) => !getMealSummary(day, meals[day], meals).hasMeal
  );
  const gapCount = gapDays.length;
  const plannedCount = days.length - gapCount;

  const weekEnd = new Date(currentWeekStart);
  weekEnd.setDate(currentWeekStart.getDate() + 6);

  return (
    <section className="screen home-screen">
      <TonightCard
        dayName={todayDayName}
        dateLabel={tonightDateLabel}
        summary={tonightSummary}
        coversNights={tonightCovers}
        leftoverDaysLabel={tonightLeftoverLabel}
        onOpenPlan={openTonightInPlan}
      />

      {showWelcome && (
        <div className="welcome-card">
          <button
            type="button"
            className="welcome-dismiss"
            aria-label="Dismiss"
            onClick={dismissWelcome}
          >
            <X size={16} aria-hidden="true" />
          </button>

          <p className="section-kicker">Getting started</p>
          <strong>Here's how it works</strong>

          <div className="welcome-steps">
            <div className="welcome-step">
              <span className="welcome-step-num">1</span>
              <p>
                <strong>Plan your week</strong> — pick recipes for each night
                on Meals; cook once and reuse leftovers.
              </p>
            </div>

            <div className="welcome-step">
              <span className="welcome-step-num">2</span>
              <p>
                <strong>Stock the basics</strong> — add recurring buys in
                Kitchen and tick what's already in stock.
              </p>
            </div>

            <div className="welcome-step">
              <span className="welcome-step-num">3</span>
              <p>
                <strong>Shop the auto-list</strong> — Shop builds your list
                from your meals, skips what's in stock, and orders it by when
                you'll need it.
              </p>
            </div>
          </div>

          <button
            type="button"
            className="primary-button welcome-cta"
            onClick={() => setActiveTab("plan")}
          >
            Start planning
          </button>
        </div>
      )}

      <div className={`home-topup ${homeShopStatus.tone}`}>
        <div className="home-topup-body">
          <p className="section-kicker">Shopping</p>
          <strong>{homeShopStatus.title}</strong>
          <span>{homeShopStatus.sub}</span>
        </div>

        {homeShopStatus.actionLabel && (
          <button
            type="button"
            className={
              homeShopStatus.tone === "needs" ? "primary-button" : "secondary"
            }
            onClick={homeShopStatus.onAction}
          >
            {homeShopStatus.actionLabel}
          </button>
        )}
      </div>

      <div className="home-week">
        <div className="home-section-head">
          <div className="home-week-heading">
            <p className="section-kicker">This week</p>
            <h2>
              {formatDate(currentWeekStart)} – {formatDate(weekEnd)}
            </h2>
          </div>

          <ProgressRing value={plannedCount} max={days.length} size={52} />
        </div>

        {gapCount > 0 ? (
          <button
            type="button"
            className="primary-button home-plan-gaps"
            onClick={() => openHomeDayInPlan(gapDays[0])}
          >
            Plan {gapCount} {gapCount === 1 ? "gap" : "gaps"}
          </button>
        ) : (
          <p className="home-week-done">🎉 Every night's planned.</p>
        )}

        <div className="meal-grid">
          <MealGroups
            dayList={days}
            meals={meals}
            getMealSummary={getMealSummary}
            onOpenDay={openHomeDayInPlan}
            todayDayName={todayDayName}
          />
        </div>

        <button
          type="button"
          className="home-nextweek"
          onClick={openNextWeekPlan}
        >
          <span>
            {nextWeekPlannedCount === days.length
              ? "Next week's all planned"
              : `Next week — ${nextWeekPlannedCount} of ${days.length} planned`}
          </span>
          <ChevronRight size={16} aria-hidden="true" />
        </button>
      </div>

      <button
        type="button"
        className="home-link home-recipes-link"
        onClick={() => {
          setMoreSection("recipes");
          setActiveTab("more");
        }}
      >
        Browse all recipes
        <ChevronRight size={15} aria-hidden="true" />
      </button>
    </section>
  );
}
