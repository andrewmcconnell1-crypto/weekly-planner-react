import { useEffect } from "react";

// Explains the (non-obvious) shopping model: stock vs recurring buys vs meals,
// how the generated list is a "top-up" of a standing grocery list, and the
// options for people who shop differently.
function ShoppingHelpSheet({ keepStandingList = true, onClose }) {
  // Lock background scroll and close on Escape while the sheet is open.
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKey(event) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", handleKey);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKey);
    };
  }, [onClose]);

  return (
    <div className="sheet-backdrop" role="presentation" onClick={onClose}>
      <div
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-label="How shopping works"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="sheet-header">
          <div className="sheet-title">
            <strong>How shopping works</strong>
            <span>Where your list comes from</span>
          </div>

          <button
            type="button"
            className="sheet-close"
            aria-label="Close"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <div className="sheet-body help-body">
          <p>
            The app builds your weekly shopping list from three things you set
            up once and keep tweaking:
          </p>

          <ul className="help-list">
            <li>
              <strong>Meals</strong> — the recipes you plan for the week. Their
              ingredients are added to the list.
            </li>
            <li>
              <strong>Stock</strong> — staples you keep at home (spices, oils,
              tins). Anything in stock is skipped, so you don't re-buy it. When
              you run out, mark it out of stock and it joins the list as a
              restock.
            </li>
            <li>
              <strong>Recurring buys</strong> — things you get most weeks (milk,
              bread, fruit). How these are treated depends on the setting below.
            </li>
          </ul>

          <h3 className="help-heading">Two ways to shop</h3>

          <p>
            <strong>Standing list (Woolworths-style).</strong> If you keep a
            saved grocery list outside the app — like a Woolworths saved list —
            your recurring buys live there. The app then only needs to tell you
            the <em>extras</em>: a <strong>Top-up</strong> list of meal
            ingredients and restocks to add, plus a “Remove from Woolworths
            list” note for anything you're now covered for or have turned off.
          </p>

          <p>
            Shopping in store or not using that list this week? Switch the Shop
            page to <strong>Full list</strong> to see everything to buy —
            including your recurring buys — laid out simply by aisle.
          </p>

          <p>
            <strong>One complete list.</strong> If you'd rather not keep a
            separate standing list at all, turn off{" "}
            <em>“I keep a standing grocery list”</em> in Settings. Then every
            shop is one complete list — meals, restocks and recurring buys
            together, grouped by aisle — and the “remove” note disappears.
          </p>

          <p className="small-text help-current">
            {keepStandingList
              ? "You're set to keep a standing list, so the Shop page defaults to the Top-up view with a Full list toggle."
              : "You're set to one complete list, so the Shop page always shows everything together."}
          </p>
        </div>
      </div>
    </div>
  );
}

export default ShoppingHelpSheet;
