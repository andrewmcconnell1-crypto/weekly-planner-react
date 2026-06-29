import { ChevronRight, X } from "lucide-react";

import TonightCard from "./TonightCard";
import MealGroups from "./MealGroups";
import { formatDate } from "../utils/dateUtils";

export default function HomeScreen({
  todayDayName,
  tonightDateLabel,
  tonightSummary,
  tonightCovers,
  tonightLeftoverLabel,
  openTonightInPlan,
  homeWeekMode,
  showHomeWeek,
  currentWeekStart,
  nextWeekStart,
  mealWeekStart,
  mealWeekEnd,
  showWelcome,
  dismissWelcome,
  setActiveTab,
  comingUpDays,
  meals,
  getMealSummary,
  openHomeDayInPlan,
  homeShopStatus,
  openHousehold,
  activeInventoryCount,
  inventoryCount,
  unifiedPending,
  setMoreSection,
}) {
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

      <div className="home-hero">
        <div className="home-week-switch" aria-label="Home week">
          <button
            type="button"
            className={homeWeekMode === "current" ? "active" : ""}
            onClick={() => showHomeWeek(currentWeekStart)}
          >
            This week
          </button>

          <button
            type="button"
            className={homeWeekMode === "next" ? "active" : ""}
            onClick={() => showHomeWeek(nextWeekStart)}
          >
            Next week
          </button>
        </div>

        <p className="section-kicker">Planning week</p>
        <h2>
          {formatDate(mealWeekStart)} to {formatDate(mealWeekEnd)}
        </h2>
      </div>

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

      {homeWeekMode === "current" ? (
        <div className="home-dashboard">
          {comingUpDays.length > 0 && (
            <div className="home-week-ahead">
              <div className="home-section-head">
                <p className="section-kicker">Coming up this week</p>
                <button
                  type="button"
                  className="home-link"
                  onClick={() => setActiveTab("plan")}
                >
                  Full plan
                  <ChevronRight size={15} aria-hidden="true" />
                </button>
              </div>

              <div className="meal-grid">
                <MealGroups
                  dayList={comingUpDays}
                  meals={meals}
                  getMealSummary={getMealSummary}
                  onOpenDay={openHomeDayInPlan}
                />
              </div>
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
                  homeShopStatus.tone === "needs"
                    ? "primary-button"
                    : "secondary"
                }
                onClick={homeShopStatus.onAction}
              >
                {homeShopStatus.actionLabel}
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="home-steps">
          <button
            className="home-step"
            type="button"
            onClick={() => openHousehold("stock")}
          >
            <span className="home-step-num">1</span>

            <span className="home-step-body">
              <strong>Stock</strong>
              <span>
                {inventoryCount} stock item{inventoryCount === 1 ? "" : "s"} ·{" "}
                {activeInventoryCount} in · {inventoryCount - activeInventoryCount}{" "}
                out
              </span>
            </span>

            <ChevronRight className="home-step-chevron" size={20} aria-hidden="true" />
          </button>

          <button
            className="home-step"
            type="button"
            onClick={() => setActiveTab("shop")}
          >
            <span className="home-step-num">2</span>

            <span className="home-step-body">
              <strong>Shop</strong>
              <span>
                {unifiedPending} item{unifiedPending === 1 ? "" : "s"} to buy
              </span>
            </span>

            <ChevronRight className="home-step-chevron" size={20} aria-hidden="true" />
          </button>
        </div>
      )}

      <div className="home-quicklinks">
        <p className="section-kicker">Set up</p>

        <div className="home-actions">
          <button
            className="secondary"
            onClick={() => {
              setMoreSection("recipes");
              setActiveTab("more");
            }}
          >
            Recipes
          </button>
        </div>
      </div>
    </section>
  );
}
