import { useEffect, useRef, useState } from "react";
import { ChevronDown, HelpCircle, ShoppingBasket } from "lucide-react";

import EmptyState from "./EmptyState";
import LadleGlyph from "./LadleGlyph";
import { normaliseItemName } from "../utils/itemUtils";
import {
  groupByTier,
  groupByAisle,
  PRIORITY_TIERS,
} from "../utils/priorityShoppingList";
import { aisleTone } from "../utils/categoryColour";
import { useCountUp } from "../hooks/useCountUp";
import AddItemRow from "./AddItemRow";

const PRIORITY_OPTIONS = PRIORITY_TIERS.map((tier) => ({
  value: tier.key,
  label: tier.title,
}));

// How long a ticked row lingers (checked, striking through, then collapsing)
// before it commits and moves to Done. Kept in sync with the `shopping-leave`
// animation in App.css so the state change lands exactly as the row finishes.
const LEAVE_MS = 640;

// One shopping list spanning this week + next. Two layouts: "priority" (urgency
// tiers, aisle within each) and "aisle" (one flat by-aisle list for a big shop).
// A "top-up only" filter hides standing-list (recurring) items.
function ShoppingList({
  newItem,
  setNewItem,
  addShoppingItem,
  availableCategories = [],
  unifiedItems = [],
  unifiedPending = 0,
  onToggleChecked,
  onDeleteManual,
  skippedItems = [],
  onAddSkipped,
  keepStandingList = true,
  usingSavedList = false,
  setUsingSavedList,
  removals = [],
  removalAckIds = [],
  pendingRemovalCount = 0,
  onToggleRemoval,
  shopLayout,
  setShopLayout,
  onOpenHelp,
  baskets = [],
  weekBasketId = "",
  onSelectBasket,
}) {
  const priorityLayout = shopLayout !== "aisle";

  // Rows mid-way through their tick-off animation. They stay rendered in the
  // pending list (shown checked) until their timer fires and commits the change.
  const [leavingIds, setLeavingIds] = useState(() => new Set());
  const leaveTimers = useRef(new Map());

  useEffect(() => {
    const timers = leaveTimers.current;
    return () => {
      for (const timer of timers.values()) clearTimeout(timer);
      timers.clear();
    };
  }, []);

  function commitToggle(item) {
    if (item.source === "Manual") onDeleteManual(item.manualId);
    else onToggleChecked(item.id);
  }

  function handleToggle(item) {
    // Un-ticking a Done item (or one already animating) commits immediately.
    if (item.checked || leavingIds.has(item.id)) {
      if (item.checked) commitToggle(item);
      return;
    }
    // Optimistically show the tick, hold so the check is felt, then let the row
    // slide out and commit the real change as the animation lands.
    setLeavingIds((prev) => new Set(prev).add(item.id));
    const timer = window.setTimeout(() => {
      leaveTimers.current.delete(item.id);
      setLeavingIds((prev) => {
        const next = new Set(prev);
        next.delete(item.id);
        return next;
      });
      commitToggle(item);
    }, LEAVE_MS);
    leaveTimers.current.set(item.id, timer);
  }

  const pendingItems = unifiedItems.filter((item) => !item.checked);
  const doneItems = unifiedItems.filter((item) => item.checked);
  const total = unifiedItems.length;
  const donePct = total > 0 ? Math.round((doneItems.length / total) * 100) : 0;
  const allDone = total > 0 && doneItems.length === total;
  const animatedPending = useCountUp(unifiedPending);

  const pendingSections = priorityLayout
    ? groupByTier(pendingItems)
    : null;
  const pendingAisles = priorityLayout ? null : groupByAisle(pendingItems);

  function renderRow(item) {
    // Manual items are ad-hoc, so ticking one removes it for good (with undo)
    // rather than parking it in Done. Meal / recurring items toggle to Done.
    // While `leaving`, the row shows checked and plays its exit before commit.
    const leaving = leavingIds.has(item.id);
    const showChecked = item.checked || leaving;

    return (
      <li
        className={`shopping-row ${item.checked ? "checked-row" : ""} ${
          leaving ? "row-leaving" : ""
        }`}
        key={item.id}
      >
        <label className={showChecked ? "checked-item" : ""}>
          <input
            type="checkbox"
            checked={showChecked}
            onChange={() => handleToggle(item)}
          />
          <span className="shopping-item-content">
            <span className="shopping-item-name">{item.name}</span>
          </span>
        </label>
      </li>
    );
  }

  function renderAisle(group, showLabel = true) {
    return (
      <div className="shopping-group" key={group.category}>
        {showLabel && (
          <div
            className="priority-aisle"
            data-aisle-tone={aisleTone(group.category)}
          >
            {group.category}
          </div>
        )}
        <ul className="clean-list shopping-rows">{group.items.map(renderRow)}</ul>
      </div>
    );
  }

  return (
    <section className="screen shop-screen">
      <div className="page-hero shop-hero">
        <p className="page-hero-kicker">Shopping list · this week + next</p>

        <strong className="page-hero-count">
          {allDone ? "All done" : `${animatedPending} to buy`}
        </strong>

        <p className="page-hero-sub">
          {doneItems.length} done · {total} total
        </p>

        {total > 0 && (
          <div
            className={`shop-hero-progress ${allDone ? "complete" : ""}`}
            role="progressbar"
            aria-valuenow={donePct}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <span style={{ width: `${donePct}%` }} />
          </div>
        )}
      </div>

      <div className="shop-controls-row">
        <div
          className="shop-list-toggle"
          role="tablist"
          aria-label="Shopping list layout"
        >
          <button
            type="button"
            role="tab"
            aria-selected={priorityLayout}
            className={priorityLayout ? "active" : ""}
            onClick={() => setShopLayout("priority")}
          >
            Priority
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={!priorityLayout}
            className={!priorityLayout ? "active" : ""}
            onClick={() => setShopLayout("aisle")}
          >
            By aisle
          </button>
        </div>

        <button type="button" className="shop-help-link" onClick={onOpenHelp}>
          <HelpCircle size={15} aria-hidden="true" />
          How shopping works
        </button>
      </div>

      {baskets.length > 0 && onSelectBasket && (
        <label className="shop-basket-picker">
          <span className="small-text">Shop a basket this week</span>
          <select
            value={weekBasketId}
            onChange={(event) => onSelectBasket(event.target.value)}
          >
            <option value="">None — build from meals</option>
            {baskets.map((basket) => (
              <option key={basket.id} value={basket.id}>
                {basket.name} ({basket.items.length} items)
              </option>
            ))}
          </select>
        </label>
      )}

      {keepStandingList && (
        <div className="shop-mode">
          <label className="shop-switch">
            <span className="shop-switch-text">
              Using your saved list this shop?
            </span>
            <input
              type="checkbox"
              role="switch"
              className="shop-switch-input"
              checked={usingSavedList}
              onChange={(event) => setUsingSavedList(event.target.checked)}
            />
          </label>

          <p className="small-text shop-mode-note">
            {usingSavedList
              ? "Your recurring buys are already on your saved list, so they're left off here — see what to take off it below."
              : "Recurring buys are added to the list so you pick up everything (e.g. in store or at another shop)."}
          </p>
        </div>
      )}

      {usingSavedList && removals.length > 0 && (
        <section className="removal-section">
          <div className="priority-tier-head">
            <h3>Take off your saved list</h3>
            <span>{pendingRemovalCount}</span>
          </div>

          <p className="small-text priority-tier-note">
            Paused or already in stock — remove these from your saved order this
            week, then tick them here.
          </p>

          <ul className="clean-list shopping-rows">
            {[...removals]
              .sort(
                (a, b) =>
                  Number(removalAckIds.includes(a.id)) -
                  Number(removalAckIds.includes(b.id))
              )
              .map((item) => {
                const done = removalAckIds.includes(item.id);

                return (
                  <li
                    className={`shopping-row removal-row ${
                      done ? "checked-row" : ""
                    }`}
                    key={item.id}
                  >
                    <label className={done ? "checked-item" : ""}>
                      <input
                        type="checkbox"
                        checked={done}
                        onChange={() => onToggleRemoval(item.id)}
                      />
                      <span className="shopping-item-content">
                        <span className="shopping-item-name">{item.name}</span>
                        <span className="shopping-source-detail">
                          {item.sourceDetail || "Already in stock"}
                        </span>
                      </span>
                    </label>
                  </li>
                );
              })}
          </ul>
        </section>
      )}

      {total === 0 ? (
        <EmptyState icon={ShoppingBasket} title="Nothing to buy yet">
          Plan some meals or mark stock as out, and your list builds itself.
        </EmptyState>
      ) : (
        <>
          {pendingItems.length === 0 ? (
            <EmptyState icon={LadleGlyph} tone="done" title="Kitchen's sorted">
              Every last thing is in the basket — go put your feet up.
            </EmptyState>
          ) : priorityLayout ? (
            pendingSections.map((tier) => (
              <section className="priority-tier" key={tier.key}>
                <div className="priority-tier-head">
                  <h3>{tier.title}</h3>
                  <span>{tier.count}</span>
                </div>
                <p className="small-text priority-tier-note">{tier.note}</p>
                {tier.groups.map((group) =>
                  renderAisle(group, tier.groups.length > 1)
                )}
              </section>
            ))
          ) : (
            <section className="priority-tier">
              {pendingAisles.map((group) => renderAisle(group))}
            </section>
          )}

          {doneItems.length > 0 && (
            <details className="done-section">
              <summary>
                <span>Done</span>
                <span className="section-collapse-end">
                  <span className="section-collapse-count">
                    {doneItems.length}
                  </span>
                  <ChevronDown
                    className="section-collapse-chevron"
                    size={16}
                    aria-hidden="true"
                  />
                </span>
              </summary>
              <ul className="clean-list shopping-rows">{doneItems.map(renderRow)}</ul>
            </details>
          )}
        </>
      )}

      {skippedItems.length > 0 && (
        <details className="skipped-section">
          <summary>
            <span>Already have</span>
            <span className="section-collapse-end">
              <span className="section-collapse-count">
                {skippedItems.length}
              </span>
              <ChevronDown
                className="section-collapse-chevron"
                size={16}
                aria-hidden="true"
              />
            </span>
          </summary>

          <p className="small-text">
            Skipped from your meals because they match something in your stock
            or recurring buys. Add any the smarts got wrong.
          </p>

          <ul className="clean-list">
            {skippedItems.map((skipped, index) => {
              const onList = unifiedItems.some(
                (item) =>
                  normaliseItemName(item.name) === normaliseItemName(skipped.name)
              );

              return (
                <li className="card skipped-row" key={`${skipped.name}-${index}`}>
                  <span className="skipped-main">
                    <strong>{skipped.name}</strong>
                    {skipped.coveredBy && <span>You have: {skipped.coveredBy}</span>}
                  </span>

                  {onList ? (
                    <span className="skipped-added">Added</span>
                  ) : (
                    <button
                      type="button"
                      className="secondary"
                      onClick={() => onAddSkipped(skipped.name)}
                    >
                      Add anyway
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </details>
      )}

      <AddItemRow
        value={newItem}
        setValue={setNewItem}
        onAdd={addShoppingItem}
        label="Add an item"
        placeholder="e.g. Coffee"
        availableCategories={availableCategories}
        defaultCategory="Other"
        priorityOptions={PRIORITY_OPTIONS}
        defaultPriority="soon"
      />
    </section>
  );
}

export default ShoppingList;
