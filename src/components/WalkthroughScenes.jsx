// Lightweight, weightless "demo" animations for the getting-started walkthrough
// and the shopping explainer. Pure CSS/SVG-free motion (no video, no assets):
// each scene is a small cluster of styled chips/rows whose reveal animation
// replays whenever the scene mounts. The walkthrough remounts the active scene
// (keyed on the step) so navigating back and forth re-runs the motion.
//
// Motion is decorative: every animated element lands on a sensible static state,
// and App.css disables the keyframes under prefers-reduced-motion.

// 1 — Plan your week: recipe cards drop into the week's nights, one per night.
export function SceneMeals() {
  const nights = [
    { day: "Mon", meal: "🍝 Pasta bake" },
    { day: "Tue", meal: "🌮 Beef tacos" },
    { day: "Wed", meal: "🍛 Thai curry" },
    { day: "Thu", meal: "🐟 Miso cod" },
  ];

  return (
    <div className="wt-scene wt-scene-meals" aria-hidden="true">
      <div className="wt-week">
        {nights.map((night, index) => (
          <div className="wt-night" key={night.day} style={{ "--i": index }}>
            <span className="wt-day">{night.day}</span>
            <span className="wt-meal">{night.meal}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// 2 — Stock your kitchen: pantry staples, a check badge popping onto each.
export function SceneStock() {
  const items = [
    { emoji: "🫒", name: "Olive oil" },
    { emoji: "🧂", name: "Salt" },
    { emoji: "🧅", name: "Onions" },
    { emoji: "🍚", name: "Rice" },
    { emoji: "🧄", name: "Garlic" },
    { emoji: "🥫", name: "Tinned tomatoes" },
  ];

  return (
    <div className="wt-scene wt-scene-stock" aria-hidden="true">
      <div className="wt-chips">
        {items.map((item, index) => (
          <span className="wt-chip" key={item.name} style={{ "--i": index }}>
            <span className="wt-chip-emoji">{item.emoji}</span>
            {item.name}
            <span className="wt-chip-check">✓</span>
          </span>
        ))}
      </div>
    </div>
  );
}

// 3 — The list builds itself: items fly into a list from your meals + recurring
// buys, and anything already in stock is struck through and skipped. This is the
// centrepiece, reused at the top of the shopping explainer.
export function SceneList() {
  const rows = [
    { name: "Chicken thighs", from: "Curry" },
    { name: "Basmati rice", from: "Curry" },
    { name: "Olive oil", from: "In stock", skip: true },
    { name: "Milk", from: "Weekly" },
    { name: "Coriander", from: "Curry" },
  ];

  return (
    <div className="wt-scene wt-scene-list" aria-hidden="true">
      <div className="wt-sources">
        <span className="wt-source wt-source-meals">Meals</span>
        <span className="wt-source wt-source-stock">Stock</span>
        <span className="wt-source wt-source-recurring">Recurring</span>
      </div>

      <div className="wt-flow-arrow">↓</div>

      <div className="wt-listcard">
        <div className="wt-listcard-head">
          <span>Your list</span>
          <span className="wt-listcard-badge">auto</span>
        </div>
        <ul className="wt-list">
          {rows.map((row, index) => (
            <li
              className={`wt-litem ${row.skip ? "wt-skip" : ""}`}
              key={row.name}
              style={{ "--i": index }}
            >
              <span className="wt-litem-dot" />
              <span className="wt-litem-name">{row.name}</span>
              <span className="wt-litem-from">{row.from}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// 4 — Shop and tick off: rows check off in sequence, the progress bar fills,
// and a little celebration lands at the end.
export function SceneShop() {
  const rows = ["Chicken thighs", "Basmati rice", "Milk", "Coriander"];

  return (
    <div className="wt-scene wt-scene-shop" aria-hidden="true">
      <div className="wt-shopcard">
        <ul className="wt-shoplist">
          {rows.map((name, index) => (
            <li className="wt-shoprow" key={name} style={{ "--i": index }}>
              <span className="wt-shopbox">✓</span>
              <span className="wt-shopname">{name}</span>
            </li>
          ))}
        </ul>
        <div className="wt-progress">
          <span className="wt-progress-fill" />
        </div>
        <div className="wt-done-pop">All done 🎉</div>
      </div>
    </div>
  );
}

