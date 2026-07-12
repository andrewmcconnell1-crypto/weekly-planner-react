import { ArrowRight, ChevronRight, PlayCircle, X } from "lucide-react";

import TonightCard from "./TonightCard";
import MealGroups from "./MealGroups";
import ProgressRing from "./ProgressRing";
import DishGlyph from "./DishGlyph";
import BistroMark from "./BistroMark";
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
  openWalkthrough,
}) {
  const gapDays = days.filter(
    (day) => !getMealSummary(day, meals[day], meals).hasMeal
  );
  const gapCount = gapDays.length;
  const plannedCount = days.length - gapCount;
  // A brand-new week (or a freshly cleared one): lead with a warm invitation to
  // plan the first dinner instead of a cold "nothing here" slate.
  const weekEmpty = plannedCount === 0;

  const weekEnd = new Date(currentWeekStart);
  weekEnd.setDate(currentWeekStart.getDate() + 6);

  return (
    <section className="screen home-screen">
      {/* On a fresh week the first-run card below is the single call to action;
          the Tonight card would just repeat "plan tonight". Bring it back once
          the week has meals, where it shows what's actually on tonight. */}
      {!weekEmpty && (
        <TonightCard
          dayName={todayDayName}
          dateLabel={tonightDateLabel}
          summary={tonightSummary}
          coversNights={tonightCovers}
          leftoverDaysLabel={tonightLeftoverLabel}
          onOpenPlan={openTonightInPlan}
        />
      )}

      {weekEmpty ? (
        <div className="home-firstrun">
          <span className="home-firstrun-glyph" aria-hidden="true">
            <DishGlyph glyph="dish" />
          </span>

          <p className="section-kicker">Let&apos;s get cooking</p>
          <strong>Plan your first dinner</strong>
          <p className="home-firstrun-lede">
            Pick a recipe for any night. Cook once, reuse the leftovers, and
            your shopping list builds itself — no more nightly “what&apos;s for
            dinner?”.
          </p>

          <div className="home-firstrun-actions">
            <button
              type="button"
              className="primary-button with-icon"
              onClick={openTonightInPlan}
            >
              Pick tonight&apos;s dinner
              <ArrowRight size={16} aria-hidden="true" />
            </button>

            <button
              type="button"
              className="welcome-skip with-icon"
              onClick={openWalkthrough}
            >
              <PlayCircle size={15} aria-hidden="true" />
              Take the 60-second tour
            </button>
          </div>
        </div>
      ) : (
        showWelcome && (
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
            <strong>New here? Take the 60-second tour</strong>
            <p className="welcome-lede">
              See how planning meals, stocking your kitchen, and an
              auto-building shopping list fit together — with a quick animated
              walkthrough.
            </p>

            <div className="welcome-actions">
              <button
                type="button"
                className="primary-button welcome-cta with-icon"
                onClick={openWalkthrough}
              >
                <PlayCircle size={16} aria-hidden="true" />
                Take the tour
              </button>

              <button
                type="button"
                className="welcome-skip"
                onClick={() => setActiveTab("plan")}
              >
                Skip — start planning
              </button>
            </div>
          </div>
        )
      )}

      {/* The shopping card is noise before anything's planned — nothing to buy
          yet. Show it once the week has meals or there's actually a list. */}
      {(!weekEmpty || homeShopStatus.actionLabel) && (
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
      )}

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

        {weekEmpty ? null : gapCount > 0 ? (
          <button
            type="button"
            className="primary-button home-plan-gaps"
            onClick={() => openHomeDayInPlan(gapDays[0])}
          >
            Plan {gapCount} {gapCount === 1 ? "gap" : "gaps"}
          </button>
        ) : (
          <p className="home-week-done">
            <BistroMark size={16} className="home-week-done-glyph" />
            Every night's planned — nice work.
          </p>
        )}

        <div className="meal-grid">
          <MealGroups
            dayList={days}
            meals={meals}
            getMealSummary={getMealSummary}
            onOpenDay={openHomeDayInPlan}
            todayDayName={todayDayName}
            weekStart={currentWeekStart}
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
        onClick={() => setActiveTab("recipes")}
      >
        Browse all recipes
        <ChevronRight size={15} aria-hidden="true" />
      </button>
    </section>
  );
}
